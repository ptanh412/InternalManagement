package com.mnp.ai.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mnp.ai.client.MLServiceClient;
import com.mnp.ai.client.ProjectClient;
import com.mnp.ai.dto.request.MLPredictionRequest;
import com.mnp.ai.dto.response.MLPredictionResponse;
import com.mnp.ai.dto.response.MLPredictionResult;
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
    private final ProjectClient projectClient;
    private final BatchDataFetchService batchDataFetchService;  // ✅ NEW: For parallel data fetching

    @Autowired
    private SkillNormalizer skillNormalizer;

    // Lowered threshold from 0.40 to 0.20
    private static final double BASE_THRESHOLD = 0.20;

    @Autowired
    public AIRecommendationService(
            FeatureEngineeringService featureEngineering,
            MLServiceClient mlServiceClient,
            DataIntegrationService dataIntegrationService,
            ProjectClient projectClient,
            BatchDataFetchService batchDataFetchService) {  // ✅ NEW parameter
        this.featureEngineering = featureEngineering;
        this.mlServiceClient = mlServiceClient;
        this.dataIntegrationService = dataIntegrationService;
        this.projectClient = projectClient;
        this.batchDataFetchService = batchDataFetchService;  // ✅ Initialize
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

        // STEP 1.5: Filter out PRINCIPAL, DIRECTOR, PROJECT_MANAGER, and LEAD (if not in project)
        // These high-level positions should not be assigned to regular tasks
        // Exception: LEAD can be assigned if they are part of the project team
        String projectId = task.getProjectId();
        List<UserProfile> eligibleCandidates = filteredCandidates.stream()
                .filter(c -> {
                    String seniority = c.getSeniorityLevel();
                    String role = c.getRole();

                    if (seniority == null && role == null) return true;

                    String normalizedSeniority = seniority != null ? seniority.toUpperCase().trim() : "";
                    String normalizedRole = role != null ? role.toUpperCase().trim() : "";

                    // Always exclude PRINCIPAL and DIRECTOR
                    if ("PRINCIPAL".equals(normalizedSeniority) || "DIRECTOR".equals(normalizedSeniority)) {
                        log.debug("Excluding candidate {} with seniority level: {}",
                                c.getUserId(), seniority);
                        return false;
                    }

                    // Always exclude PROJECT_MANAGER role
                    if ("PROJECT_MANAGER".equals(normalizedRole)) {
                        log.debug("Excluding candidate {} with role: PROJECT_MANAGER", c.getUserId());
                        return false;
                    }

                    // For LEAD: check if they are part of the project team
                    if ("LEAD".equals(normalizedSeniority)) {
                        try {
                            Boolean isTeamLead = projectClient.isTeamLead(projectId, c.getUserId());
                            if (Boolean.TRUE.equals(isTeamLead)) {
                                log.info("✅ Including LEAD {} - they are part of project {}",
                                        c.getUserId(), projectId);
                                return true;
                            } else {
                                log.info("❌ Excluding LEAD {} - not part of project {}",
                                        c.getUserId(), projectId);
                                return false;
                            }
                        } catch (Exception e) {
                            log.error("Error checking if LEAD {} is in project {}: {}",
                                    c.getUserId(), projectId, e.getMessage());
                            // On error, exclude LEAD to be safe
                            return false;
                        }
                    }

                    return true;
                })
                .collect(Collectors.toList());

        if (!eligibleCandidates.isEmpty()) {
            log.info("Info candidate: {}", eligibleCandidates.get(0));
        }
        log.info("Candidates after seniority filter: {} out of {} (excluded PRINCIPAL/DIRECTOR/PROJECT_MANAGER/LEAD not in project)",
                eligibleCandidates.size(), filteredCandidates.size());

        if (eligibleCandidates.isEmpty()) {
            log.warn("No candidates available after filtering out PRINCIPAL/DIRECTOR levels for task: {}",
                    task.getTaskId());
            return Collections.emptyList();
        }

        // ✅ PERFORMANCE OPTIMIZATION: Batch fetch all user data in parallel
        // Old approach: N sequential API calls per user (workload + availability + performance)
        // New approach: 3 parallel batch calls for ALL users at once
        log.info("🚀 Batch fetching workload/availability/profiles for {} candidates", eligibleCandidates.size());
        List<String> userIds = eligibleCandidates.stream()
                .map(UserProfile::getUserId)
                .collect(Collectors.toList());

        BatchDataFetchService.BatchUserData batchData = batchDataFetchService.fetchAllDataBatch(userIds);
        log.info("✅ Batch data fetched: {} workloads, {} availabilities, {} profiles",
                batchData.workloads().size(),
                batchData.availabilities().size(),
                batchData.userProfiles().size());

        // Enrich UserProfile objects with batch-fetched data
        eligibleCandidates.forEach(candidate -> {
            String userId = candidate.getUserId();

            // Set workload data if available
            var workload = batchData.workloads().get(userId);
            if (workload != null && workload.getUtilizationPercentage() != null) {
                candidate.setWorkloadCapacity(workload.getUtilizationPercentage() / 100.0);
            }

            // Set availability data if available
            var availability = batchData.availabilities().get(userId);
            if (availability != null && availability.getAvailabilityPercentage() != null) {
                candidate.setAvailabilityScore(availability.getAvailabilityPercentage() / 100.0);
                if (availability.getIsAvailable() != null) {
                    candidate.setAvailabilityStatus(availability.getIsAvailable() ? "AVAILABLE" : "UNAVAILABLE");
                }
            }

            // ✅ Set performance score from UserProfileResponse.user.performanceScore
            var userProfile = batchData.userProfiles().get(userId);
            if (userProfile != null && userProfile.getUser() != null && userProfile.getUser().getPerformanceScore() != null) {
                candidate.setPerformanceScore(userProfile.getUser().getPerformanceScore());
            }
        });

        // STEP 2: Calculate AI scores for filtered candidates (now with enriched data)
        List<Map<String, Object>> candidatesWithAIScores = eligibleCandidates.stream()
                .map(c -> {
                    double baseMatch = calculateBaseSkillMatch(task, c);
                    Map<String, Double> aiScores = featureEngineering.calculateAIScores(c, task, baseMatch);

                    log.debug("AI Scores for candidate {}: {}", c.getUserId(), aiScores);

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
     * Maps all TaskType enum values to appropriate departments:
     * - Backend Development: BACKEND_DEVELOPMENT, DATABASE_DEVELOPMENT, ARCHITECTURE, SECURITY
     * - Frontend Development: FRONTEND_DEVELOPMENT, DESIGN
     * - Mobile Development: MOBILE_DEVELOPMENT
     * - DevOps: DEPLOYMENT, MAINTENANCE
     * - Quality Assurance: TESTING, UNIT_TESTING, INTEGRATION_TESTING, BUG_FIX
     * - Engineering: DEVELOPMENT, RESEARCH, DOCUMENTATION, CODE_REVIEW, PLANNING
     */
    private boolean isDepartmentAlignedWithTask(String department, String taskType) {
        log.info("Checking department alignment for {} and {} task", department, taskType);

        // Normalize for case-insensitive comparison
        String normalizedType = taskType.replace("_", " ").toLowerCase();

        // ==================== BACKEND DEVELOPMENT ====================
        // Handles: BACKEND_DEVELOPMENT, DATABASE_DEVELOPMENT, ARCHITECTURE, SECURITY
        if (department.contains("backend") || department.contains("back-end")) {
            return normalizedType.contains("backend") ||
                   normalizedType.contains("back-end") ||
                   normalizedType.contains("database") ||
                   normalizedType.contains("api") ||
                   normalizedType.contains("server") ||
                   normalizedType.contains("microservice") ||
                   normalizedType.contains("architecture") ||
                   normalizedType.contains("security");
        }

        // ==================== FRONTEND DEVELOPMENT ====================
        // Handles: FRONTEND_DEVELOPMENT, DESIGN
        if (department.contains("frontend") || department.contains("front-end")) {
            return normalizedType.contains("frontend") ||
                   normalizedType.contains("front-end") ||
                   normalizedType.contains("ui") ||
                   normalizedType.contains("ux") ||
                   normalizedType.contains("web") ||
                   normalizedType.contains("interface") ||
                   normalizedType.contains("design");
        }

        // ==================== MOBILE DEVELOPMENT ====================
        // Handles: MOBILE_DEVELOPMENT
        if (department.contains("mobile") || department.contains("app")) {
            return normalizedType.contains("mobile") ||
                   normalizedType.contains("ios") ||
                   normalizedType.contains("android") ||
                   normalizedType.contains("app");
        }

        // ==================== DEVOPS ====================
        // Handles: DEPLOYMENT, MAINTENANCE
        if (department.contains("devops") || department.contains("infrastructure")) {
            return normalizedType.contains("devops") ||
                   normalizedType.contains("deployment") ||
                   normalizedType.contains("infrastructure") ||
                   normalizedType.contains("ci/cd") ||
                   normalizedType.contains("ci cd") ||
                   normalizedType.contains("docker") ||
                   normalizedType.contains("kubernetes") ||
                   normalizedType.contains("maintenance");
        }

        // ==================== QUALITY ASSURANCE (QA) ====================
        // Handles: TESTING, UNIT_TESTING, INTEGRATION_TESTING, BUG_FIX
        if (department.contains("qa") ||
            department.contains("quality") ||
            department.contains("test") ||
            department.contains("assurance")) {
            return normalizedType.contains("test") ||
                   normalizedType.contains("qa") ||
                   normalizedType.contains("quality") ||
                   normalizedType.contains("bug") ||
                   normalizedType.contains("unit testing") ||
                   normalizedType.contains("integration testing") ||
                   normalizedType.contains("fix");
        }

        // ==================== ENGINEERING (General) ====================
        // Handles: DEVELOPMENT, RESEARCH, DOCUMENTATION, CODE_REVIEW, PLANNING
        // This is a catch-all for general development tasks that don't fit specific departments
        if (department.contains("engineering") && !department.contains("devops")) {
            return normalizedType.contains("development") ||
                   normalizedType.contains("feature") ||
                   normalizedType.contains("implementation") ||
                   normalizedType.contains("research") ||
                   normalizedType.contains("documentation") ||
                   normalizedType.contains("code review") ||
                   normalizedType.contains("planning");
        }

        // No specific match found - reject to enforce strict department matching
        log.info("⚠️  No department alignment found for {} department and {} task type",
                department, taskType);
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
            taskData.put("title", task.getTitle() != null ? task.getTitle() : "");
            taskData.put("priority", task.getPriority() != null ? task.getPriority() : "MEDIUM");
            taskData.put("difficulty", task.getDifficulty() != null ? task.getDifficulty() : "MEDIUM");
            taskData.put("estimated_hours", task.getEstimatedHours() != null ? task.getEstimatedHours() : 40.0);
            taskData.put("required_skills", task.getRequiredSkills() != null ?
                new ArrayList<>(task.getRequiredSkills().keySet()) : Collections.emptyList());
            taskData.put("task_type", task.getType() != null ? task.getType() : "GENERAL");
            taskData.put("description", task.getDescription() != null ? task.getDescription() : "");

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

        // --- BƯỚC 1: TÌM ỨNG VIÊN ---
        UserProfile candidate = candidates.stream()
                .filter(c -> c.getUserId().equals(mlPred.getUserId()))
                .findFirst()
                .orElse(null);

        if (candidate == null) {
            log.warn("Candidate not found for ML prediction: {}", mlPred.getUserId());
            return null;
        }

        // --- BƯỚC 2: TÍNH TOÁN BUSINESS BOOST (Điểm thưởng nghiệp vụ) ---
        double businessBoost = 0.0;
        List<String> boostReasons = new ArrayList<>();

        // 2.1 Department Alignment
        String candidateDept = candidate.getDepartment();
        String taskType = task.getType();
        if (candidateDept != null && taskType != null) {
            if (isDepartmentAlignedWithTask(candidateDept, taskType)) {
                businessBoost += 0.10;
                boostReasons.add("Department matches task type");
            }
        }

        // 2.2 Priority & Seniority
        if (("URGENT".equals(task.getPriority()) || "HIGH".equals(task.getPriority()))) {
            int seniorityNum = parseSeniorityLevel(candidate.getSeniorityLevel());
            if (seniorityNum >= 4) {
                businessBoost += 0.05;
                boostReasons.add("Senior developer for urgent task");
            }
        }

        // 2.3 Availability Boost
        if ("AVAILABLE".equals(candidate.getAvailabilityStatus())) {
            businessBoost += 0.03;
            boostReasons.add("Currently available");
        }

        // 2.4 Recent Performance Boost
        if (candidate.getTaskCompletionRate() != null && candidate.getTaskCompletionRate() > 0.9) {
            businessBoost += 0.03;
            boostReasons.add("Excellent track record");
        }

        // 2.5 Capacity Match
        Double capacity = candidate.getWorkloadCapacity();
        Integer estimatedHours = task.getEstimatedHours();
        if (capacity != null && estimatedHours != null && estimatedHours > 0) {
            double capacityRatio = capacity / estimatedHours;
            if (capacityRatio >= 1.5) {
                businessBoost += 0.02;
                boostReasons.add("Has plenty of capacity");
            }
        }

        // --- BƯỚC 3: TÍNH ĐIỂM TỔNG (FINAL SCORE) ---
        double mlScore = mlPred.getMlConfidenceScore();
        // Công thức: 80% từ AI + 20% từ Business Rules
        double finalScore = (mlScore * 0.8) + (businessBoost * 0.2);
        finalScore = Math.min(1.0, finalScore);

        // --- BƯỚC 4: KHỞI TẠO DTO ---
        AssignmentRecommendation recommendation = new AssignmentRecommendation();
        recommendation.setUserId(candidate.getUserId());
        recommendation.setTaskId(task.getTaskId());
        recommendation.setOverallScore(finalScore);
        recommendation.setHybridScore(mlScore);
        recommendation.setContentBasedScore(mlScore);
        recommendation.setCollaborativeFilteringScore(0.0);

        // --- BƯỚC 5: GÁN CHỈ SỐ HIỂN THỊ (DISPLAY METRICS - TỪ DB) ---

        // 5.1 Performance Score (Rating)
        if (candidate.getPerformanceRating() != null) {
            recommendation.setPerformanceScore(candidate.getPerformanceRating());
        } else {
            recommendation.setPerformanceScore(0.5);
        }

        // 5.2 Task Success Rate (Statistic)
        if (candidate.getTaskCompletionRate() != null) {
            recommendation.setTaskSuccessRate(candidate.getTaskCompletionRate());
        } else {
            recommendation.setTaskSuccessRate(0.0);
        }

        // 5.3 Workload Score
        double workloadScore = 0.5;
        if (candidate.getWorkloadCapacity() != null && candidate.getWorkloadCapacity() > 0) {
            workloadScore = Math.min(1.0, candidate.getWorkloadCapacity() / 40.0);
        }
        recommendation.setWorkloadScore(workloadScore);

        // 5.4 Availability Score
        double availabilityScore = "AVAILABLE".equalsIgnoreCase(candidate.getAvailabilityStatus()) ? 1.0 : 0.5;
        recommendation.setAvailabilityScore(availabilityScore);

        // 5.5 Collaboration Score
        recommendation.setCollaborationScore(0.7);

        // --- BƯỚC 6: XỬ LÝ SKILL MATCHING & BONUS SKILLS ---
        List<String> candidateSkillNames = candidate.getSkills() != null ? new ArrayList<>(candidate.getSkills().keySet()) : new ArrayList<>();
        List<String> requiredSkills = task.getRequiredSkills() != null ? new ArrayList<>(task.getRequiredSkills().keySet()) : new ArrayList<>();

        Set<String> normalizedCandidateSkills = candidateSkillNames.stream().map(s -> s.toLowerCase().trim()).collect(Collectors.toSet());
        Set<String> normalizedRequiredSkills = requiredSkills.stream().map(s -> s.toLowerCase().trim()).collect(Collectors.toSet());

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        List<String> bonusSkills = new ArrayList<>();

        for (String required : requiredSkills) {
            String normalizedRequired = required.toLowerCase().trim();
            boolean found = normalizedCandidateSkills.stream()
                    .anyMatch(cs -> cs.contains(normalizedRequired) || normalizedRequired.contains(cs));
            if (found) matchedSkills.add(required);
            else missingSkills.add(required);
        }

        for (String candidateSkill : candidateSkillNames) {
            String normalized = candidateSkill.toLowerCase().trim();
            boolean isRequired = normalizedRequiredSkills.stream()
                    .anyMatch(rs -> normalized.contains(rs) || rs.contains(normalized));
            if (!isRequired) bonusSkills.add(candidateSkill);
        }

        recommendation.setMatchedSkills(matchedSkills);
        recommendation.setMissingSkills(missingSkills);
        recommendation.setBonusSkills(bonusSkills.size() > 5 ? bonusSkills.subList(0, 5) : bonusSkills);

        // --- BƯỚC 7: QUYẾT ĐỊNH ĐIỂM SKILL & TÍNH TOÁN CONTRIBUTION MAP ---

        // 7.1 Tính toán Exact Skill Match
        double exactMatchScore = requiredSkills.isEmpty() ? 1.0 : (double) matchedSkills.size() / requiredSkills.size();

        // 7.2 Lấy Feature Importance từ ML
        Map<String, Double> featureImportance = mlPred.getFeatureImportance();
        double aiSemanticSkillScore = 0.0;

        // Tạo Map đóng góp (Contribution Map)
        Map<String, Double> contributionMap = new HashMap<>();

        // Các nhóm đóng góp
        double skillContrib = 0.0;
        double perfContrib = 0.0;
        double availContrib = 0.0;

        if (featureImportance != null) {
            // Cộng gộp các feature vào nhóm tương ứng
            // Skill Group
            skillContrib += featureImportance.getOrDefault("base_skill_match_score", 0.0);
            skillContrib += featureImportance.getOrDefault("overall_skill_match_score", 0.0);
            skillContrib += featureImportance.getOrDefault("related_skills_score", 0.0);
            aiSemanticSkillScore = featureImportance.getOrDefault("base_skill_match_score", 0.0);

            // Performance Group
            perfContrib += featureImportance.getOrDefault("performance_score", 0.0);
            perfContrib += featureImportance.getOrDefault("task_success_rate", 0.0);

            // Availability Group
            availContrib += featureImportance.getOrDefault("workload_availability_score", 0.0);
            availContrib += featureImportance.getOrDefault("workload_score", 0.0);
        } else {
            // Fallback nếu ML không trả về importance
            skillContrib = 0.3;
            perfContrib = 0.4;
            availContrib = 0.3;
        }

        // 7.3 Tính điểm Skill hiển thị
        if (aiSemanticSkillScore > exactMatchScore + 0.2) {
            recommendation.setSkillMatchScore(aiSemanticSkillScore);
        } else {
            recommendation.setSkillMatchScore(Math.max(exactMatchScore, aiSemanticSkillScore));
        }

        // --- BƯỚC 8: CHUẨN HÓA & ĐÓNG GÓI CONTRIBUTION MAP ---
        // Mục tiêu: Map các giá trị thô thành tỷ lệ đóng góp vào Final Score

        // Trọng số của ML là 80% (0.8), Business là 20% (0.2)
        // Ta chuẩn hóa sao cho tổng các thành phần = 100% (hoặc tỉ lệ tương đối)

        // Đóng góp từ AI (Skill, Perf, Avail)
        contributionMap.put("Skill Match", skillContrib * 0.8);
        contributionMap.put("Performance History", perfContrib * 0.8);
        contributionMap.put("Availability & Workload", availContrib * 0.8);

        // Đóng góp từ Business Boost (Strategic Fit)
        // Nếu có boost, phần này sẽ chiếm tỷ trọng trong 20% còn lại
        if (businessBoost > 0) {
            contributionMap.put("Strategic Fit", businessBoost * 0.2 * 5); // Nhân hệ số để hiển thị rõ hơn trên biểu đồ
        } else {
            contributionMap.put("Strategic Fit", 0.0);
        }

        // Gán vào DTO
        recommendation.setScoreContribution(contributionMap);

        // --- BƯỚC 9: EXPLANATION & REASONING ---
        StringBuilder skillSummary = new StringBuilder();
        skillSummary.append(String.format("%d/%d required skills matched.", matchedSkills.size(), requiredSkills.size()));
        if (aiSemanticSkillScore > exactMatchScore + 0.2) {
            skillSummary.append(" 💡 AI detected related technical competency.");
        }
        recommendation.setSkillMatchSummary(skillSummary.toString());

        if (!missingSkills.isEmpty()) {
            recommendation.setSkillDevelopmentOpportunity("Can learn: " + String.join(", ", missingSkills));
        } else if (!bonusSkills.isEmpty()) {
            recommendation.setSkillDevelopmentOpportunity("Brings extra expertise in: " +
                    String.join(", ", bonusSkills.subList(0, Math.min(3, bonusSkills.size()))));
        }

        String finalReason = mlPred.getExplanation();
        if (finalReason == null || finalReason.length() < 10) {
            finalReason = String.format("Strong candidate with %.0f%% confidence score.", finalScore * 100);
        }
        if (!boostReasons.isEmpty()) {
            finalReason += " Boosted by: " + String.join(", ", boostReasons) + ".";
        }

        recommendation.setRecommendationReason(finalReason);
        recommendation.setGeminiReasoning(finalReason);

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

