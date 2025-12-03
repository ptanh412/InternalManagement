package com.mnp.ai.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mnp.ai.client.MLServiceClient;
import com.mnp.ai.dto.MLPredictionRequest;
import com.mnp.ai.dto.MLPredictionResponse;
import com.mnp.ai.dto.MLPredictionResult;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AIRecommendationService {

    private final FeatureEngineeringService featureEngineering;
    private final MLServiceClient mlServiceClient;
    private final DataIntegrationService dataIntegrationService;
    private final GeminiRecommendationService geminiRecommendationService;
    private final SkillCategoryMatcher skillCategoryMatcher;

    @Autowired
    private SkillNormalizer skillNormalizer;

    // Lowered threshold from 0.40 to 0.20
    private static final double BASE_THRESHOLD = 0.20;

    @Autowired
    public AIRecommendationService(
            FeatureEngineeringService featureEngineering,
            MLServiceClient mlServiceClient,
            DataIntegrationService dataIntegrationService,
            GeminiRecommendationService geminiRecommendationService,
            SkillCategoryMatcher skillCategoryMatcher) {
        this.featureEngineering = featureEngineering;
        this.mlServiceClient = mlServiceClient;
        this.dataIntegrationService = dataIntegrationService;
        this.geminiRecommendationService = geminiRecommendationService;
        this.skillCategoryMatcher = skillCategoryMatcher;
    }

    /**
     * Main recommendation method with hybrid approach
     */
    public List<AssignmentRecommendation> recommendCandidates(String taskId) {
        TaskProfile task = dataIntegrationService.getTaskProfile(taskId);

        List<UserProfile> candidates = dataIntegrationService.getSmartCandidates(task);
        log.info("Starting hybrid recommendation for task: {}", task.getTaskId());

        if (candidates == null || candidates.isEmpty()) {
            log.warn("No candidates available for task: {}", task.getTaskId());
            return Collections.emptyList();
        }

        // STEP 0: Deduplicate raw candidates by userId (preserve order)
        List<UserProfile> uniqueRawCandidates = candidates.stream()
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(UserProfile::getUserId, c -> c, (a, b) -> a, java.util.LinkedHashMap::new),
                        m -> new ArrayList<>(m.values())));

        if (uniqueRawCandidates.size() != candidates.size()) {
            log.info("Deduplicated raw candidates: {} original -> {} unique", candidates.size(), uniqueRawCandidates.size());
        }

        // STEP 1: Quick Filter with low threshold (20%)
        List<UserProfile> filteredCandidates = uniqueRawCandidates.stream()
                .filter(c -> quickFilter(c, task))
                .collect(Collectors.toList());

        log.info("Candidates after quick filter: {} out of {}", filteredCandidates.size(), uniqueRawCandidates.size());

        if (filteredCandidates.isEmpty()) {
            log.warn("No candidates passed quick filter for task: {}", task.getTaskId());
            return Collections.emptyList();
        }

        // STEP 1.5: Filter out PRINCIPAL and DIRECTOR seniority levels
        // These high-level positions should not be assigned to regular tasks
        List<UserProfile> eligibleCandidates = filteredCandidates.stream()
                .filter(c -> {
                    String seniority = c.getSeniorityLevel();
                    if (seniority == null) return true;

                    String normalizedSeniority = seniority.toUpperCase().trim();
                    boolean isExcluded = "PRINCIPAL".equals(normalizedSeniority) ||
                                       "DIRECTOR".equals(normalizedSeniority);

                    if (isExcluded) {
                        log.debug("Excluding candidate {} with seniority level: {}",
                                c.getUserId(), seniority);
                    }

                    return !isExcluded;
                })
                .collect(Collectors.toList());
        log.info("Info candidate: {}" , eligibleCandidates.getFirst());
        log.info("Candidates after seniority filter: {} out of {} (excluded PRINCIPAL/DIRECTOR)",
                eligibleCandidates.size(), filteredCandidates.size());

        if (eligibleCandidates.isEmpty()) {
            log.warn("No candidates available after filtering out PRINCIPAL/DIRECTOR levels for task: {}",
                    task.getTaskId());
            return Collections.emptyList();
        }

        // STEP 2: Calculate AI scores for filtered candidates
        // ML service will fetch full user data from databases
        List<Map<String, Object>> candidatesWithAIScores = eligibleCandidates.stream()
                .map(c -> {
                    double baseMatch = calculateBaseSkillMatch(task, c);
                    Map<String, Double> aiScores = featureEngineering.calculateAIScores(c, task, baseMatch);

                    // Return minimal data: userId + AI scores only
                    Map<String, Object> candidateData = new HashMap<>();
                    candidateData.put("userId", c.getUserId());
                    candidateData.putAll(aiScores);

                    return candidateData;
                })
                .collect(Collectors.toList());

        log.info("Calculated AI scores for {} candidates", candidatesWithAIScores.size());

        // STEP 3: ML Prediction - send userIds and AI scores
        // ML service will fetch performance, workload, skills data directly from databases
        MLPredictionResponse mlResponse = callMLService(task, candidatesWithAIScores);

        if (mlResponse == null || mlResponse.getPredictions() == null || mlResponse.getPredictions().isEmpty()) {
            log.error("ML service returned no predictions, returning empty list");
            return Collections.emptyList();
        }

        log.info("Received {} ML predictions", mlResponse.getPredictions().size());

        // STEP 4: Apply Business Rules using the eligible candidates list (already filtered)
        List<AssignmentRecommendation> recommendations = mlResponse.getPredictions().stream()
                .map(pred -> applyBusinessRules(pred, task, eligibleCandidates))
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(AssignmentRecommendation::getOverallScore).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.get(i).setRank(i + 1);
        }

        log.info("Final recommendations: {} candidates", recommendations.size());

        return recommendations;
    }

    /**
     * Quick filter with strict department matching requirement
     * Only allows candidates from the same department as the task type
     */
    private boolean quickFilter(UserProfile candidate, TaskProfile task) {
        // Check availability
        if (candidate.getAvailabilityStatus() != null &&
                "UNAVAILABLE".equalsIgnoreCase(candidate.getAvailabilityStatus())) {
            return false;
        }

        // Department alignment check - STRICT REQUIREMENT
        String candidateDept = candidate.getDepartment();
        String taskType = task.getType();

        if (candidateDept != null && taskType != null) {
            String normalizedDept = candidateDept.toLowerCase().trim();
            String normalizedTaskType = taskType.toLowerCase().trim();

            boolean isDepartmentMatch = isDepartmentAlignedWithTask(normalizedDept, normalizedTaskType);

            // ==================== STRICT DEPARTMENT MATCHING ====================
            // ONLY allow candidates from the same department
            if (!isDepartmentMatch) {
                log.info("❌ FILTERED OUT (Cross-Dept Not Allowed): {} from {} for {} task",
                        candidate.getName(), candidateDept, taskType);
                return false;
            }

            // Department matches - now check skill match
            double baseMatch = calculateBaseSkillMatch(task, candidate);
            double minThreshold = 0.20; // 20% minimum for same department

            if (baseMatch >= minThreshold) {
                log.info("✅ QUALIFIED (Same Dept): {} from {} for {} task - Match: {}%",
                        candidate.getName(), candidateDept, taskType,
                        String.format("%.1f", baseMatch * 100));
                return true;
            } else {
                log.info("❌ FILTERED OUT (Same Dept, Low Match): {} from {} for {} task - Match: {}% (required: {}%)",
                        candidate.getName(), candidateDept, taskType,
                        String.format("%.1f", baseMatch * 100),
                        String.format("%.1f", minThreshold * 100));
                return false;
            }
        }

        // No department info: reject to enforce department matching
        log.info("❌ FILTERED OUT (No Dept Info): {} - Cannot verify department alignment",
                candidate.getName());
        return false;
    }

    /**
     * Check if candidate's department aligns with task type
     */
    private boolean isDepartmentAlignedWithTask(String department, String taskType) {
        log.info("Checking department alignment for {} and {} task", department, taskType);
        // Backend Development alignment
        if (department.contains("backend") || department.contains("back-end")) {
            return taskType.contains("backend") || taskType.contains("back-end") ||
                   taskType.contains("api") || taskType.contains("server") ||
                   taskType.contains("database") || taskType.contains("microservice");
        }

        // Frontend Development alignment
        if (department.contains("frontend") || department.contains("front-end")) {
            return taskType.contains("frontend") || taskType.contains("front-end") ||
                   taskType.contains("ui") || taskType.contains("ux") ||
                   taskType.contains("web") || taskType.contains("interface");
        }

        // Mobile Development alignment
        if (department.contains("mobile") || department.contains("app")) {
            return taskType.contains("mobile") || taskType.contains("ios") ||
                   taskType.contains("android") || taskType.contains("app");
        }

        // DevOps alignment
        if (department.contains("devops") || department.contains("infrastructure")) {
            return taskType.contains("devops") || taskType.contains("deployment") ||
                   taskType.contains("infrastructure") || taskType.contains("ci/cd") ||
                   taskType.contains("docker") || taskType.contains("kubernetes");
        }

        // QA/Testing alignment
        if (department.contains("qa") || department.contains("quality") || department.contains("test")) {
            return taskType.contains("test") || taskType.contains("qa") ||
                   taskType.contains("quality") || taskType.contains("bug");
        }

        // Engineering department - can match most development tasks
        if (department.contains("engineering") && !department.contains("devops")) {
            return taskType.contains("development") || taskType.contains("feature") ||
                   taskType.contains("implementation");
        }

        // No specific match found - allow through (will be evaluated by skill match)
        return false;
    }

    /**
     * Calculate base skill match
     */
    private double calculateBaseSkillMatch(TaskProfile task, UserProfile candidate) {
        Map<String, Double> requiredSkills = task.getRequiredSkills();
        Map<String, Double> candidateSkills = candidate.getSkills();

        log.info("========================================");
        log.info("SKILL MATCHING - Task: {} | Candidate: {} ({})",
                task.getTaskId(), candidate.getName(), candidate.getUserId());
        log.info("========================================");

        if (requiredSkills == null || requiredSkills.isEmpty()) {
            log.info("✅ No required skills for task - returning 100% match");
            return 1.0;
        }
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            log.warn("❌ Candidate has NO skills - returning 0% match");
            log.info("Required skills: {}", requiredSkills.keySet());
            return 0.0;
        }

        // Log task required skills
        log.info("📋 TASK REQUIRED SKILLS ({} total):", requiredSkills.size());
        requiredSkills.forEach((skill, level) ->
                log.info("  - {} (level: {})", skill, level));

        // Log candidate skills
        log.info("👤 CANDIDATE SKILLS ({} total):", candidateSkills.size());
        candidateSkills.forEach((skill, prof) ->
                log.info("  - {} (proficiency: {})", skill, prof));

        // ==================== NEW: Semantic Matching ====================
        Set<String> requiredSkillNames = requiredSkills.keySet();
        Set<String> candidateSkillNames = candidateSkills.keySet();

        Map<String, SkillNormalizer.SkillMatchResult> semanticMatches =
                skillNormalizer.calculateSemanticMatch(candidateSkillNames, requiredSkillNames);

        // Calculate weighted score with proficiency consideration
        double totalWeightedScore = 0.0;
        int totalSkills = requiredSkills.size();

        List<String> exactMatches = new ArrayList<>();
        List<String> partialMatches = new ArrayList<>();
        List<String> semanticMatchList = new ArrayList<>();
        List<String> unmatchedList = new ArrayList<>();

        log.info("🔍 SEMANTIC MATCHING ANALYSIS:");

        for (Map.Entry<String, SkillNormalizer.SkillMatchResult> entry : semanticMatches.entrySet()) {
            String requiredSkill = entry.getKey();
            SkillNormalizer.SkillMatchResult matchResult = entry.getValue();
            Double requiredLevel = requiredSkills.get(requiredSkill);

            double baseScore = matchResult.getScore();
            double finalScore = baseScore;

            // If matched, consider proficiency level
            if (matchResult.getMatchedSkill() != null) {
                Double candidateProficiency = candidateSkills.get(matchResult.getMatchedSkill());
                if (candidateProficiency != null && requiredLevel != null) {
                    // Proficiency modifier: if candidate has higher proficiency than required, boost score
                    double proficiencyRatio = Math.min(candidateProficiency / requiredLevel, 1.2);
                    finalScore = baseScore * proficiencyRatio;
                }
            }

            totalWeightedScore += finalScore;

            // Categorize and log
            switch (matchResult.getMatchType()) {
                case EXACT:
                    exactMatches.add(String.format("%s ← %s (proficiency: %.1f)",
                            requiredSkill, matchResult.getMatchedSkill(),
                            candidateSkills.get(matchResult.getMatchedSkill())));
                    log.info("  ✅ EXACT MATCH: '{}' ← '{}' (score: {}, proficiency: {})",
                            requiredSkill, matchResult.getMatchedSkill(),
                            String.format("%.2f", finalScore),
                            candidateSkills.get(matchResult.getMatchedSkill()));
                    break;

                case PARTIAL:
                    partialMatches.add(String.format("%s ← %s (partial, proficiency: %.1f)",
                            requiredSkill, matchResult.getMatchedSkill(),
                            candidateSkills.get(matchResult.getMatchedSkill())));
                    log.info("  ➜ PARTIAL MATCH: '{}' ← '{}' (score: {}, proficiency: {})",
                            requiredSkill, matchResult.getMatchedSkill(),
                            String.format("%.2f", finalScore),
                            candidateSkills.get(matchResult.getMatchedSkill()));
                    break;

                case SEMANTIC:
                    semanticMatchList.add(String.format("%s ← %s (semantic, proficiency: %.1f)",
                            requiredSkill, matchResult.getMatchedSkill(),
                            candidateSkills.get(matchResult.getMatchedSkill())));
                    log.info("  🔗 SEMANTIC MATCH: '{}' ← '{}' (score: {}, proficiency: {})",
                            requiredSkill, matchResult.getMatchedSkill(),
                            String.format("%.2f", finalScore),
                            candidateSkills.get(matchResult.getMatchedSkill()));
                    break;

                case NO_MATCH:
                    unmatchedList.add(requiredSkill);
                    log.info("  ❌ NO MATCH: '{}' (not found in candidate skills)", requiredSkill);
                    break;
            }
        }

        double result = totalWeightedScore / totalSkills;

        log.info("========================================");
        log.info("📊 SEMANTIC SKILL MATCH SUMMARY:");
        log.info("  Overall Match Score: {} ({} %)",
                String.format("%.4f", result), String.format("%.1f", result * 100));

        if (!exactMatches.isEmpty()) {
            log.info("  ✅ Exact Matches ({}):", exactMatches.size());
            exactMatches.forEach(m -> log.info("     • {}", m));
        }

        if (!partialMatches.isEmpty()) {
            log.info("  ➜ Partial Matches ({}):", partialMatches.size());
            partialMatches.forEach(m -> log.info("     • {}", m));
        }

        if (!semanticMatchList.isEmpty()) {
            log.info("  🔗 Semantic Matches ({}):", semanticMatchList.size());
            semanticMatchList.forEach(m -> log.info("     • {}", m));
        }

        if (!unmatchedList.isEmpty()) {
            log.info("  ❌ Unmatched ({}):", unmatchedList.size());
            unmatchedList.forEach(m -> log.info("     • {}", m));
        }

        log.info("========================================");

        return result;
    }

    /**
     * Call ML service for predictions
     */
    private MLPredictionResponse callMLService(TaskProfile task, List<Map<String, Object>> candidatesWithAIScores) {
        try {
            Map<String, Object> taskData = new HashMap<>();
            taskData.put("task_id", task.getTaskId());
            taskData.put("priority", task.getPriority() != null ? task.getPriority() : "MEDIUM");
            taskData.put("difficulty", task.getDifficulty() != null ? task.getDifficulty() : "MEDIUM");
            taskData.put("estimated_hours", task.getEstimatedHours() != null ? task.getEstimatedHours() : 40.0);
            taskData.put("required_skills", task.getRequiredSkills() != null ?
                new ArrayList<>(task.getRequiredSkills().keySet()) : Collections.emptyList());
            taskData.put("task_type", task.getType() != null ? task.getType() : "GENERAL");
            taskData.put("description", task.getDescription());

            MLPredictionRequest request = MLPredictionRequest.builder()
                    .taskId(task.getTaskId())
                    .taskData(taskData)
                    .candidates(candidatesWithAIScores)  // Only userIds + AI scores
                    .build();

            log.info("Calling ML service for task: {}", taskData);
            log.info("Sending {} candidates with AI scores", candidatesWithAIScores.size());
            if (!candidatesWithAIScores.isEmpty()) {
                log.info("Sample candidate data: {}", candidatesWithAIScores.get(0));
            }

            MLPredictionResponse response = mlServiceClient.predictCandidates(request);

            // ✅ Log what we received from ML service
            if (response != null) {
                log.info("ML Service Response received:");
                log.info("  - Model Version: {}", response.getModelVersion());
                log.info("  - Processing Time: {}ms", response.getProcessingTimeMs());
                log.info("  - Number of predictions: {}", response.getPredictions() != null ? response.getPredictions().size() : 0);

                if (response.getPredictions() != null && !response.getPredictions().isEmpty()) {
                    log.info("  - Top 3 predictions:");
                    for (int i = 0; i < Math.min(3, response.getPredictions().size()); i++) {
                        MLPredictionResult pred = response.getPredictions().get(i);
                        log.info("    {}. User: {}, Score: {}, Fallback: {}",
                            i + 1, pred.getUserId(), String.format("%.3f", pred.getMlConfidenceScore()), pred.isFallback());
                    }
                } else {
                    log.warn("  - ML service returned EMPTY predictions list!");
                }
            } else {
                log.error("  - ML service returned NULL response!");
            }

            return response;
        } catch (Exception e) {
            log.error("Error calling ML service", e);
            // Fallback will be handled by Feign fallback
            return null;
        }
    }

    /**
     * Apply business rules and calculate final score
     */
    private AssignmentRecommendation applyBusinessRules(
            MLPredictionResult mlPred,
            TaskProfile task,
            List<UserProfile> candidates) {

        UserProfile candidate = candidates.stream()
                .filter(c -> c.getUserId().equals(mlPred.getUserId()))
                .findFirst()
                .orElse(null);


        if (candidate == null) {
            log.warn("Candidate not found for ML prediction: {}", mlPred.getUserId());
            return null;
        }

        double mlScore = mlPred.getMlConfidenceScore();

        log.info("ML Score: {}", mlScore);
        double businessBoost = 0.0;
        List<String> boostReasons = new ArrayList<>();

        // 1. Department Alignment Boost (NEW - HIGHEST PRIORITY)
        String candidateDept = candidate.getDepartment();
        String taskType = task.getType();
        if (candidateDept != null && taskType != null) {
            boolean isDeptMatch = isDepartmentAlignedWithTask(
                candidateDept.toLowerCase().trim(),
                taskType.toLowerCase().trim()
            );
            if (isDeptMatch) {
                businessBoost += 0.10; // Strong boost for department match
                boostReasons.add("Department matches task type (+10%)");
                log.info("✅ Department alignment: {} matches {} task", candidateDept, taskType);
            } else {
                log.info("⚠️  Cross-department: {} for {} task (no boost)", candidateDept, taskType);
            }
        }

        // 2. Priority Boost
        if ("URGENT".equals(task.getPriority()) || "HIGH".equals(task.getPriority())) {
            // Convert seniority level string to numeric for comparison
            int seniorityNum = parseSeniorityLevel(candidate.getSeniorityLevel());
            if (seniorityNum >= 4) {
                businessBoost += 0.05;
                boostReasons.add("Senior developer for urgent task (+5%)");
            }
            Double successRate = candidate.getTaskCompletionRate();
            if (successRate != null && successRate > 0.9) {
                businessBoost += 0.03;
                boostReasons.add("High success rate for urgent task (+3%)");
            }
        }

        // 2. Priority Boost
        if ("URGENT".equals(task.getPriority()) || "HIGH".equals(task.getPriority())) {
            // Convert seniority level string to numeric for comparison
            int seniorityNum = parseSeniorityLevel(candidate.getSeniorityLevel());
            if (seniorityNum >= 4) {
                businessBoost += 0.05;
                boostReasons.add("Senior developer for urgent task (+5%)");
            }
            Double successRate = candidate.getTaskCompletionRate();
            if (successRate != null && successRate > 0.9) {
                businessBoost += 0.03;
                boostReasons.add("High success rate for urgent task (+3%)");
            }
        }

        // 3. Availability Boost
        if ("AVAILABLE".equals(candidate.getAvailabilityStatus())) {
            businessBoost += 0.03;
            boostReasons.add("Currently available (+3%)");
        }

        log.info("Business Boost: {}", businessBoost);

        // 4. Recent Performance Boost
        Double successRate = candidate.getTaskCompletionRate();
        log.info("Success Rate: {}", successRate);
        if (successRate != null && successRate > 0.9) {
            businessBoost += 0.03;
            boostReasons.add("Excellent track record (+3%)");
        }

        // 5. Capacity Match
        Double capacity = candidate.getWorkloadCapacity();
        log.info("Capacity: {}", capacity);
        Integer estimatedHours = task.getEstimatedHours();
        log.info("Estimated Hours: {}", estimatedHours);
        if (capacity != null && estimatedHours != null && estimatedHours > 0) {
            double capacityRatio = capacity / estimatedHours;
            if (capacityRatio >= 1.5) {
                businessBoost += 0.02;
                boostReasons.add("Has plenty of capacity (+2%)");
            }
        }

        // 6. Experience Match for Difficulty
        int seniorityNum = parseSeniorityLevel(candidate.getSeniorityLevel());
        log.info("Seniority Num: {}", seniorityNum);
        if ("HARD".equals(task.getDifficulty()) && seniorityNum >= 4) {
            businessBoost += 0.04;
            boostReasons.add("Senior for hard task (+4%)");
        }
        log.info("Business Boost After Experience Match: {}", businessBoost);
        // Calculate final score: 80% ML, 20% Business Rules
        double finalScore = (mlScore * 0.8) + (businessBoost * 0.2);

        log.info("Final Score: {}", finalScore);

        AssignmentRecommendation recommendation = new AssignmentRecommendation();
        recommendation.setUserId(candidate.getUserId());
        recommendation.setTaskId(task.getTaskId());
        recommendation.setOverallScore(finalScore);
        recommendation.setContentBasedScore(mlScore);
        recommendation.setCollaborativeFilteringScore(0.0);
        recommendation.setHybridScore(finalScore);

        // Extract individual scores from feature importance if available
        Map<String, Double> featureImportance = mlPred.getFeatureImportance();
        if (featureImportance != null) {
            recommendation.setSkillMatchScore(featureImportance.getOrDefault("skill_match_score", mlScore));
            recommendation.setWorkloadScore(featureImportance.getOrDefault("workload_score", 0.0));
            recommendation.setPerformanceScore(featureImportance.getOrDefault("performance_score", 0.0));
            recommendation.setAvailabilityScore(featureImportance.getOrDefault("availability_score", 0.0));
            recommendation.setCollaborationScore(featureImportance.getOrDefault("collaboration_score", 0.0));
        } else {
            // Use defaults based on candidate profile
            recommendation.setSkillMatchScore(mlScore);
            recommendation.setWorkloadScore(candidate.getWorkloadCapacity() != null ?
                Math.min(1.0, candidate.getWorkloadCapacity() / 100.0) : 0.5);
            recommendation.setPerformanceScore(candidate.getTaskCompletionRate() != null ?
                candidate.getTaskCompletionRate() : 0.7);
            recommendation.setAvailabilityScore("AVAILABLE".equals(candidate.getAvailabilityStatus()) ? 1.0 : 0.5);
            recommendation.setCollaborationScore(0.7);
        }

        // ========== ADD SKILL MATCHING DETAILS USING EXISTING SERVICES ==========
        // Use SkillCategoryMatcher for intelligent skill matching
        // candidate.getSkills() returns Map<String, Double> - extract keys as skill names
        List<String> candidateSkillNames = candidate.getSkills() != null ?
            new ArrayList<>(candidate.getSkills().keySet()) :
            new ArrayList<>();

        // task.getRequiredSkills() also returns Map<String, Double> - extract keys
        List<String> requiredSkills = task.getRequiredSkills() != null ?
            new ArrayList<>(task.getRequiredSkills().keySet()) :
            new ArrayList<>();

        Set<String> candidateSkillSet = new HashSet<>(candidateSkillNames);
        Set<String> requiredSkillSet = new HashSet<>(requiredSkills);

        // Find exact matches using SkillNormalizer
        Set<String> normalizedCandidateSkills = candidateSkillNames.stream()
            .map(s -> s.toLowerCase().trim())
            .collect(Collectors.toSet());
        Set<String> normalizedRequiredSkills = requiredSkills.stream()
            .map(s -> s.toLowerCase().trim())
            .collect(Collectors.toSet());

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        // Check each required skill
        for (String required : requiredSkills) {
            String normalizedRequired = required.toLowerCase().trim();
            boolean found = normalizedCandidateSkills.stream()
                .anyMatch(cs -> cs.contains(normalizedRequired) || normalizedRequired.contains(cs));

            if (found) {
                matchedSkills.add(required);
            } else {
                missingSkills.add(required);
            }
        }

        // Find bonus skills (skills candidate has beyond requirements)
        List<String> bonusSkills = new ArrayList<>();
        for (String candidateSkill : candidateSkillNames) {
            String normalized = candidateSkill.toLowerCase().trim();
            boolean isRequired = normalizedRequiredSkills.stream()
                .anyMatch(rs -> normalized.contains(rs) || rs.contains(normalized));
            if (!isRequired) {
                bonusSkills.add(candidateSkill);
            }
        }

        recommendation.setMatchedSkills(matchedSkills);
        recommendation.setMissingSkills(missingSkills);
        recommendation.setBonusSkills(bonusSkills.size() > 5 ? bonusSkills.subList(0, 5) : bonusSkills);

        // Create skill match summary using category matching
        Set<String> matchedCategories = skillCategoryMatcher.getMatchedCategories(candidateSkillSet, requiredSkillSet);
        Set<String> candidateCategories = skillCategoryMatcher.getCategoriesForSkills(candidateSkillSet);

        StringBuilder skillSummary = new StringBuilder();
        if (!matchedSkills.isEmpty()) {
            skillSummary.append(String.format("%d/%d required skills matched",
                matchedSkills.size(), requiredSkills.size()));
            if (!matchedCategories.isEmpty()) {
                skillSummary.append(String.format(" (%s domain)",
                    String.join(", ", matchedCategories)));
            }
        }
        if (!missingSkills.isEmpty() && !matchedCategories.isEmpty()) {
            // If they have category overlap, they can learn the missing skills
            if (skillSummary.length() > 0) skillSummary.append(". ");
            skillSummary.append("Can learn: ");
            skillSummary.append(String.join(", ", missingSkills.subList(0, Math.min(3, missingSkills.size()))));
            if (missingSkills.size() > 3) {
                skillSummary.append(String.format(" +%d more", missingSkills.size() - 3));
            }
        }
        recommendation.setSkillMatchSummary(skillSummary.toString());

        // Use FeatureEngineeringService to calculate learning potential
        // candidate.getSkills() is already Map<String, Double> where Double is proficiency level
        Map<String, Double> candidateSkillMap = candidate.getSkills() != null ?
            candidate.getSkills() : new HashMap<>();

        double learningPotential = featureEngineering.calculateLearningPotential(
            requiredSkills, candidateSkillMap, candidate.getSeniorityLevel());

        if (!missingSkills.isEmpty()) {
            StringBuilder devOpportunity = new StringBuilder();

            // Check which missing skills are in related categories
            List<String> canLearnEasily = new ArrayList<>();
            List<String> needsTraining = new ArrayList<>();

            for (String missing : missingSkills) {
                Set<String> missingCategories = skillCategoryMatcher.getCategories(missing);
                // If candidate has experience in same category, they can learn easily
                boolean hasRelatedExperience = missingCategories.stream()
                    .anyMatch(candidateCategories::contains);

                if (hasRelatedExperience) {
                    canLearnEasily.add(missing);
                } else {
                    needsTraining.add(missing);
                }
            }

            if (!canLearnEasily.isEmpty()) {
                devOpportunity.append("Can quickly learn ");
                devOpportunity.append(String.join(", ", canLearnEasily));
                devOpportunity.append(" (has ").append(String.join(", ", matchedCategories))
                    .append(" experience)");
            }
            if (!needsTraining.isEmpty()) {
                if (devOpportunity.length() > 0) devOpportunity.append(". ");
                devOpportunity.append("Will need training for ");
                devOpportunity.append(String.join(", ", needsTraining.subList(0, Math.min(2, needsTraining.size()))));
            }

            // Add learning potential score info
            if (learningPotential > 0.15) {
                devOpportunity.append(String.format(" (High learning potential: %.1f%%)", learningPotential * 100));
            }

            recommendation.setSkillDevelopmentOpportunity(devOpportunity.toString());
        } else if (!bonusSkills.isEmpty()) {
            recommendation.setSkillDevelopmentOpportunity(
                String.format("Expert with %d bonus skills including %s",
                    bonusSkills.size(),
                    String.join(", ", bonusSkills.subList(0, Math.min(3, bonusSkills.size())))));
        }

        // Generate concise recommendation reason using Gemini AI
        String geminiReason = geminiRecommendationService.generateRecommendationReasonForCandidate(
            recommendation, task, candidate);
        recommendation.setRecommendationReason(geminiReason);
        recommendation.setGeminiReasoning(geminiReason);

        return recommendation;
    }


    /**
     * Parse seniority level string to numeric value
     */
    private int parseSeniorityLevel(String seniorityLevel) {
        if (seniorityLevel == null) return 2;

        switch (seniorityLevel.toUpperCase()) {
            case "INTERN":
                return 1;
            case "JUNIOR":
                return 2;
            case "MID_LEVEL":
            case "MIDLEVEL":
            case "MID LEVEL":
                return 3;
            case "SENIOR":
                return 4;
            case "LEAD":
                return 5;
            case "PRINCIPAL":
                return 6;
            case "DIRECTOR":
                return 7;
            default:
                // Try to parse as number
                try {
                    return Integer.parseInt(seniorityLevel);
                } catch (NumberFormatException e) {
                    return 2; // Default to mid-level
                }
        }
    }
}

