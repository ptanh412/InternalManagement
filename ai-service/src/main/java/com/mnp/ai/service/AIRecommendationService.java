package com.mnp.ai.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mnp.ai.algorithm.HybridRecommendationAlgorithm;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {

    private final HybridRecommendationAlgorithm hybridRecommendationAlgorithm;
    private final DataIntegrationService dataIntegrationService;
    private final GeminiRecommendationService geminiRecommendationService;

    /**
     * Generate AI-powered task assignment recommendations with Gemini AI enhancement
     */
    public List<AssignmentRecommendation> generateTaskAssignmentRecommendations(String taskId) {
        log.info("Generating AI recommendations for task: {}", taskId);

        try {
            // Get task profile
            TaskProfile taskProfile = dataIntegrationService.getTaskProfile(taskId);
            if (taskProfile == null) {
                log.error("Task profile not found for taskId: {}", taskId);
                throw new RuntimeException("Task profile not found");
            }

            // Get candidate user profiles
            List<UserProfile> candidates = dataIntegrationService.getSmartCandidates(taskProfile);
            if (candidates.isEmpty()) {
                log.warn("No candidates found for task: {}", taskId);
                return List.of();
            }

            // Check if task has HIGH or CRITICAL priority for enhanced AI analysis
            String priority = taskProfile.getPriority();
            boolean useGeminiAI = "HIGH".equalsIgnoreCase(priority) || "CRITICAL".equalsIgnoreCase(priority) ||
                                 taskProfile.getDifficulty() != null && "HARD".equalsIgnoreCase(taskProfile.getDifficulty());

            List<AssignmentRecommendation> recommendations;

            if (useGeminiAI) {
                log.info("Using Gemini AI for enhanced recommendations due to {} priority task", priority);
                try {
                    // Use Gemini AI for intelligent analysis and team lead prioritization
                    recommendations = geminiRecommendationService.generateGeminiRecommendations(taskProfile, candidates);

                    // If Gemini recommendations are successful, enhance with hybrid scores for comparison
                    recommendations = enhanceWithHybridScores(recommendations, taskProfile, candidates);

                } catch (Exception e) {
                    log.warn("Gemini AI recommendations failed, falling back to hybrid algorithm: {}", e.getMessage());
                    recommendations = hybridRecommendationAlgorithm.generateRecommendations(taskProfile, candidates);
                    recommendations = applyBasicTeamLeadPrioritization(recommendations, taskProfile, candidates);
                }
            } else {
                // Use standard hybrid algorithm for regular priority tasks
                log.info("Using hybrid algorithm for standard priority task");
                recommendations = hybridRecommendationAlgorithm.generateRecommendations(taskProfile, candidates);
                // Still apply team lead logic for HIGH/CRITICAL priority
                recommendations = applyBasicTeamLeadPrioritization(recommendations, taskProfile, candidates);
            }

            // Clean up and ensure all fields have proper values
            recommendations = cleanupRecommendations(recommendations, taskProfile, candidates);

            log.info("Generated {} recommendations for task: {}", recommendations.size(), taskId);
            return recommendations;

        } catch (Exception e) {
            log.error("Error generating recommendations for task: {}", taskId, e);
            throw new RuntimeException("Failed to generate recommendations", e);
        }
    }

    /**
     * Clean up recommendations to ensure all fields have proper values and remove unused fields
     */
    private List<AssignmentRecommendation> cleanupRecommendations(
            List<AssignmentRecommendation> recommendations,
            TaskProfile taskProfile,
            List<UserProfile> candidates) {

        log.info("Cleaning up recommendations to ensure all fields have proper values");

        for (AssignmentRecommendation rec : recommendations) {
            UserProfile candidate = findCandidateById(rec.getUserId(), candidates);

            // Ensure isTeamLead is never null
            if (rec.getIsTeamLead() == null) {
                rec.setIsTeamLead(candidate != null && isTeamLeadOrSenior(candidate));
            }

            // Generate personalized reasoning based on candidate profile
            String personalizedReasoning = generatePersonalizedReasoning(rec, candidate, taskProfile);
            rec.setGeminiReasoning(personalizedReasoning);

            // Replace recommendationReason with geminiReasoning
            rec.setRecommendationReason(personalizedReasoning);

            // Ensure geminiScore has a value (use hybridScore as fallback)
            if (rec.getGeminiScore() == null) {
                rec.setGeminiScore(rec.getHybridScore() != null ? rec.getHybridScore() : rec.getOverallScore());
            }

            // Calculate realistic individual scores based on candidate data
            calculateRealisticIndividualScores(rec, candidate, taskProfile);

            // Ensure all core hybrid scores have values
            if (rec.getContentBasedScore() == null) {
                rec.setContentBasedScore(0.5);
            }
            if (rec.getCollaborativeFilteringScore() == null) {
                rec.setCollaborativeFilteringScore(0.5);
            }
            if (rec.getHybridScore() == null) {
                rec.setHybridScore(rec.getOverallScore());
            }
        }

        // Ensure proper differentiation by adding small random variations to identical scores
        ensureScoreDifferentiation(recommendations);

        return recommendations;
    }

    /**
     * Generate personalized reasoning for each candidate
     */
    private String generatePersonalizedReasoning(AssignmentRecommendation rec, UserProfile candidate, TaskProfile taskProfile) {
        if (candidate == null) {
            return "Candidate profile not available for detailed analysis.";
        }

        StringBuilder reasoning = new StringBuilder();

        // Start with candidate identification
        String name = candidate.getName() != null ? candidate.getName() : "Candidate";
        String role = candidate.getRole() != null ? candidate.getRole() : "Team Member";

        reasoning.append(String.format("%s (%s) ", name, role));

        // Add team lead context if applicable
        if (Boolean.TRUE.equals(rec.getIsTeamLead())) {
            reasoning.append("is identified as a team lead/senior member. ");
        }

        // Experience assessment
        Double experience = candidate.getExperienceYears();
        if (experience != null) {
            if (experience >= 7) {
                reasoning.append(String.format("With %.1f years of experience, brings deep expertise. ", experience));
            } else if (experience >= 3) {
                reasoning.append(String.format("Has solid %.1f years of experience. ", experience));
            } else {
                reasoning.append(String.format("Early career with %.1f years of experience. ", experience));
            }
        }

        // Performance assessment
        Double performance = candidate.getPerformanceRating();
        if (performance != null) {
            if (performance >= 4.5) {
                reasoning.append("Excellent performance track record (4.5+/5.0). ");
            } else if (performance >= 4.0) {
                reasoning.append("Strong performance history (4.0+/5.0). ");
            } else if (performance >= 3.5) {
                reasoning.append("Good performance rating (3.5+/5.0). ");
            } else {
                reasoning.append("Developing performance (below 3.5/5.0). ");
            }
        }

        // Skill match assessment
        double skillScore = rec.getSkillMatchScore() != null ? rec.getSkillMatchScore() : 0.5;
        if (skillScore >= 0.8) {
            reasoning.append("Excellent skill alignment with task requirements. ");
        } else if (skillScore >= 0.6) {
            reasoning.append("Good skill match for this task. ");
        } else if (skillScore >= 0.4) {
            reasoning.append("Moderate skill alignment. ");
        } else {
            reasoning.append("Limited skill match, may need support. ");
        }

        // Workload assessment
        Integer workload = candidate.getCurrentWorkLoadHours();
        if (workload != null) {
            if (workload <= 20) {
                reasoning.append("Currently has light workload, highly available. ");
            } else if (workload <= 35) {
                reasoning.append("Moderate workload, good availability. ");
            } else {
                reasoning.append("Heavy current workload, limited availability. ");
            }
        }

        // Department alignment
        String candidateDept = candidate.getDepartment();
        String taskDept = taskProfile.getDepartment();
        if (candidateDept != null && taskDept != null && candidateDept.equalsIgnoreCase(taskDept)) {
            reasoning.append("Perfect department alignment. ");
        } else if (candidateDept != null && taskDept != null) {
            reasoning.append("Cross-department assignment. ");
        }

        // Priority context
        String priority = taskProfile.getPriority();
        if ("HIGH".equalsIgnoreCase(priority) || "CRITICAL".equalsIgnoreCase(priority)) {
            if (Boolean.TRUE.equals(rec.getIsTeamLead())) {
                reasoning.append(String.format("Well-suited for this %s priority task requiring leadership.", priority.toLowerCase()));
            } else {
                reasoning.append(String.format("Can contribute to this %s priority task with proper support.", priority.toLowerCase()));
            }
        }

        return reasoning.toString().trim();
    }

    /**
     * Calculate realistic individual scores based on actual candidate data
     */
    private void calculateRealisticIndividualScores(AssignmentRecommendation rec, UserProfile candidate, TaskProfile taskProfile) {
        if (candidate == null) {
            // Set default values for missing candidate
            rec.setSkillMatchScore(0.3);
            rec.setWorkloadScore(0.5);
            rec.setPerformanceScore(0.5);
            rec.setAvailabilityScore(0.5);
            rec.setCollaborationScore(0.5);
            return;
        }

        // Calculate skill match score based on candidate's actual skills
        double skillMatchScore = calculateActualSkillMatch(candidate, taskProfile);
        rec.setSkillMatchScore(skillMatchScore);

        // Calculate workload score based on current hours
        double workloadScore = calculateActualWorkloadScore(candidate);
        rec.setWorkloadScore(workloadScore);

        // Calculate performance score from rating
        double performanceScore = calculateActualPerformanceScore(candidate);
        rec.setPerformanceScore(performanceScore);

        // Calculate availability based on status and workload
        double availabilityScore = calculateActualAvailabilityScore(candidate);
        rec.setAvailabilityScore(availabilityScore);

        // Calculate collaboration score (randomized for diversity)
        double collaborationScore = 0.3 + (Math.random() * 0.4); // 0.3 to 0.7 range
        rec.setCollaborationScore(Math.round(collaborationScore * 100.0) / 100.0);
    }

    private double calculateActualSkillMatch(UserProfile candidate, TaskProfile taskProfile) {
        Map<String, Double> candidateSkills = candidate.getSkills();
        Map<String, Double> requiredSkills = taskProfile.getRequiredSkills();

        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.2 + (Math.random() * 0.3); // 0.2 to 0.5 for no skills
        }

        if (requiredSkills == null || requiredSkills.isEmpty()) {
            // Base score on experience and role
            Double experience = candidate.getExperienceYears();
            double baseScore = 0.4;
            if (experience != null) {
                baseScore += Math.min(0.3, experience * 0.05); // Up to 0.3 bonus for experience
            }
            return Math.round((baseScore + (Math.random() * 0.2)) * 100.0) / 100.0;
        }

        // Calculate actual skill matching - OPTIMIZED VERSION
        double totalScore = 0.0;
        int matchedSkills = 0;

        // Pre-process candidate skills for faster lookup
        Map<String, Double> normalizedCandidateSkills = new java.util.HashMap<>();
        for (Map.Entry<String, Double> entry : candidateSkills.entrySet()) {
            normalizedCandidateSkills.put(entry.getKey().toLowerCase().trim(), entry.getValue());
        }

        for (Map.Entry<String, Double> required : requiredSkills.entrySet()) {
            String requiredSkillName = required.getKey().toLowerCase().trim();
            double requiredLevel = required.getValue();
            boolean skillMatched = false;

            // First try exact match
            if (normalizedCandidateSkills.containsKey(requiredSkillName)) {
                double candidateLevel = normalizedCandidateSkills.get(requiredSkillName);
                matchedSkills++;
                if (candidateLevel >= requiredLevel) {
                    totalScore += 1.0;
                } else {
                    totalScore += candidateLevel / requiredLevel;
                }
                skillMatched = true;
            } else {
                // Try partial matching - but limit iterations for performance
                int iterations = 0;
                for (Map.Entry<String, Double> candidateEntry : normalizedCandidateSkills.entrySet()) {
                    if (++iterations > 20) break; // Limit iterations to prevent timeout

                    String candidateSkillName = candidateEntry.getKey();

                    // Use more efficient string matching
                    if (isSkillMatch(requiredSkillName, candidateSkillName)) {
                        matchedSkills++;
                        double candidateLevel = candidateEntry.getValue();
                        if (candidateLevel >= requiredLevel) {
                            totalScore += 1.0;
                        } else {
                            totalScore += candidateLevel / requiredLevel;
                        }
                        skillMatched = true;
                        break; // Exit inner loop once match is found
                    }
                }
            }

            // If no skill matched, don't count it against total
            if (!skillMatched && requiredSkills.size() <= 5) {
                // For small skill sets, penalize missing skills less
                totalScore += 0.1;
            }
        }

        double matchRatio = requiredSkills.size() > 0 ? totalScore / requiredSkills.size() : 0.5;
        return Math.round(Math.min(1.0, matchRatio) * 100.0) / 100.0;
    }

    /**
     * Efficient skill matching helper method
     */
    private boolean isSkillMatch(String required, String candidate) {
        if (required.equals(candidate)) {
            return true;
        }

        // Check if either contains the other (but limit string operations)
        if (required.length() <= 20 && candidate.length() <= 20) {
            return candidate.contains(required) || required.contains(candidate);
        }

        // For longer strings, just check prefix/suffix to avoid performance issues
        return candidate.startsWith(required) || required.startsWith(candidate) ||
               candidate.endsWith(required) || required.endsWith(candidate);
    }

    private double calculateActualWorkloadScore(UserProfile candidate) {
        Integer currentHours = candidate.getCurrentWorkLoadHours();
        if (currentHours == null) {
            return 0.5 + (Math.random() * 0.3); // 0.5 to 0.8 default
        }

        // Workload score: higher is better (less busy)
        double score;
        if (currentHours <= 20) {
            score = 0.9 + (Math.random() * 0.1); // 0.9 to 1.0
        } else if (currentHours <= 30) {
            score = 0.7 + (Math.random() * 0.2); // 0.7 to 0.9
        } else if (currentHours <= 40) {
            score = 0.4 + (Math.random() * 0.3); // 0.4 to 0.7
        } else {
            score = 0.1 + (Math.random() * 0.3); // 0.1 to 0.4
        }

        return Math.round(score * 100.0) / 100.0;
    }

    private double calculateActualPerformanceScore(UserProfile candidate) {
        Double rating = candidate.getPerformanceRating();
        if (rating == null) {
            return 0.4 + (Math.random() * 0.3); // 0.4 to 0.7 default
        }

        // Convert 5-point scale to 0-1 scale with some variation
        double baseScore = rating / 5.0;
        double variation = (Math.random() - 0.5) * 0.1; // ±0.05 variation
        double finalScore = Math.max(0.0, Math.min(1.0, baseScore + variation));

        return Math.round(finalScore * 100.0) / 100.0;
    }

    private double calculateActualAvailabilityScore(UserProfile candidate) {
        String status = candidate.getAvailabilityStatus();
        Integer workload = candidate.getCurrentWorkLoadHours();

        double baseScore = 0.5;

        // Status-based scoring
        if ("AVAILABLE".equalsIgnoreCase(status)) {
            baseScore = 0.8 + (Math.random() * 0.2); // 0.8 to 1.0
        } else if ("BUSY".equalsIgnoreCase(status)) {
            baseScore = 0.3 + (Math.random() * 0.4); // 0.3 to 0.7
        } else if ("UNAVAILABLE".equalsIgnoreCase(status)) {
            baseScore = 0.1 + (Math.random() * 0.2); // 0.1 to 0.3
        }

        // Adjust based on workload
        if (workload != null) {
            if (workload <= 20) {
                baseScore = Math.min(1.0, baseScore + 0.1);
            } else if (workload > 40) {
                baseScore = Math.max(0.1, baseScore - 0.2);
            }
        }

        return Math.round(baseScore * 100.0) / 100.0;
    }

    /**
     * Ensure candidates have different scores to avoid identical rankings
     */
    private void ensureScoreDifferentiation(List<AssignmentRecommendation> recommendations) {
        // Group recommendations by identical overall scores
        var scoreGroups = recommendations.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                rec -> Math.round(rec.getOverallScore() * 10000) // Round to 4 decimal places
            ));

        // Add small differentiation for identical scores
        for (var group : scoreGroups.values()) {
            if (group.size() > 1) {
                log.debug("Found {} candidates with identical scores, adding differentiation", group.size());

                for (int i = 0; i < group.size(); i++) {
                    AssignmentRecommendation rec = group.get(i);

                    // Add small variation based on secondary criteria
                    double skillMatchBonus = (rec.getSkillMatchScore() != null ? rec.getSkillMatchScore() : 0.5) * 0.01;
                    double performanceBonus = (rec.getPerformanceScore() != null ? rec.getPerformanceScore() : 0.5) * 0.005;
                    double availabilityBonus = (rec.getAvailabilityScore() != null ? rec.getAvailabilityScore() : 0.5) * 0.005;
                    double teamLeadBonus = Boolean.TRUE.equals(rec.getIsTeamLead()) ? 0.01 : 0.0;

                    // Subtract small amount for lower ranking candidates in same score group
                    double adjustment = skillMatchBonus + performanceBonus + availabilityBonus + teamLeadBonus - (i * 0.001);

                    double newScore = Math.min(1.0, Math.max(0.0, rec.getOverallScore() + adjustment));
                    rec.setOverallScore(Math.round(newScore * 10000.0) / 10000.0); // Round to 4 decimal places
                    rec.setHybridScore(rec.getOverallScore());
                }
            }
        }

        // Sort again after score adjustment
        recommendations.sort((r1, r2) -> {
            int scoreCompare = Double.compare(r2.getOverallScore(), r1.getOverallScore());
            if (scoreCompare != 0) {
                return scoreCompare;
            }
            // Secondary sort by team lead status
            return Boolean.compare(Boolean.TRUE.equals(r2.getIsTeamLead()), Boolean.TRUE.equals(r1.getIsTeamLead()));
        });

        // Re-assign ranks after sorting
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.get(i).setRank(i + 1);
        }
    }

    /**
     * Enhance Gemini recommendations with hybrid algorithm scores for comparison
     */
    private List<AssignmentRecommendation> enhanceWithHybridScores(
            List<AssignmentRecommendation> geminiRecommendations,
            TaskProfile taskProfile,
            List<UserProfile> candidates) {

        try {
            // Get hybrid recommendations for score comparison
            List<AssignmentRecommendation> hybridRecommendations =
                hybridRecommendationAlgorithm.generateRecommendations(taskProfile, candidates);

            // Merge Gemini reasoning with hybrid scores
            for (AssignmentRecommendation geminiRec : geminiRecommendations) {
                hybridRecommendations.stream()
                    .filter(hybridRec -> hybridRec.getUserId().equals(geminiRec.getUserId()))
                    .findFirst()
                    .ifPresent(hybridRec -> {
                        // Keep Gemini's reasoning and overall score, but add hybrid details
                        geminiRec.setContentBasedScore(hybridRec.getContentBasedScore());
                        geminiRec.setCollaborativeFilteringScore(hybridRec.getCollaborativeFilteringScore());
                        geminiRec.setSkillMatchScore(hybridRec.getSkillMatchScore());
                        geminiRec.setPerformanceScore(hybridRec.getPerformanceScore());
                        geminiRec.setAvailabilityScore(hybridRec.getAvailabilityScore());
                        geminiRec.setWorkloadScore(hybridRec.getWorkloadScore());
                        geminiRec.setCollaborationScore(hybridRec.getCollaborationScore());

                        // Store original hybrid score for comparison
                        geminiRec.setHybridScore(hybridRec.getHybridScore());

                        // Store Gemini score separately (keep Gemini's overall score)
                        geminiRec.setGeminiScore(geminiRec.getOverallScore());
                    });
            }

            return geminiRecommendations;

        } catch (Exception e) {
            log.warn("Failed to enhance with hybrid scores: {}", e.getMessage());
            return geminiRecommendations;
        }
    }

    /**
     * Apply basic team lead prioritization when Gemini AI is not used
     */
    private List<AssignmentRecommendation> applyBasicTeamLeadPrioritization(
            List<AssignmentRecommendation> recommendations,
            TaskProfile taskProfile,
            List<UserProfile> candidates) {

        String priority = taskProfile.getPriority();
        boolean isHighPriority = "HIGH".equalsIgnoreCase(priority) || "CRITICAL".equalsIgnoreCase(priority);

        log.info("Applying team lead identification and prioritization for {} priority task", priority);

        // Always identify team leads, but only boost scores for high priority
        for (AssignmentRecommendation rec : recommendations) {
            UserProfile candidate = findCandidateById(rec.getUserId(), candidates);
            boolean isTeamLead = candidate != null && isTeamLeadOrSenior(candidate);
            rec.setIsTeamLead(isTeamLead);

            if (isHighPriority && isTeamLead) {
                // Boost overall score by 15% for high priority tasks
                double boostedScore = Math.min(1.0, rec.getOverallScore() * 1.15);
                rec.setOverallScore(boostedScore);

                // Update recommendation reason
                String enhancedReason = String.format(
                    "[%s PRIORITY - TEAM LEAD PRIORITIZED] %s",
                    priority, rec.getRecommendationReason()
                );
                rec.setRecommendationReason(enhancedReason);
            }
        }

        if (isHighPriority) {
            // Re-sort by updated scores
            recommendations.sort((r1, r2) -> Double.compare(r2.getOverallScore(), r1.getOverallScore()));

            // Re-rank
            for (int i = 0; i < recommendations.size(); i++) {
                recommendations.get(i).setRank(i + 1);
            }
        }

        return recommendations;
    }

    /**
     * Check if a candidate is a team lead or senior member
     */
    private boolean isTeamLeadOrSenior(UserProfile candidate) {
        String role = candidate.getRole();
        if (role != null) {
            String roleLower = role.toLowerCase();
            if (roleLower.contains("lead") || roleLower.contains("senior") ||
                roleLower.contains("manager") || roleLower.contains("architect")) {
                return true;
            }
        }

        // Also consider experience level (5+ years)
        Double experience = candidate.getExperienceYears();
        if (experience != null && experience >= 5.0) {
            return true;
        }

        // Consider high performance rating (4.0+)
        Double performance = candidate.getPerformanceRating();
        if (performance != null && performance >= 4.0) {
            return true;
        }

        return false;
    }

    /**
     * Find candidate by ID
     */
    private UserProfile findCandidateById(String userId, List<UserProfile> candidates) {
        return candidates.stream()
            .filter(candidate -> candidate.getUserId().equals(userId))
            .findFirst()
            .orElse(null);
    }

    /**
     * Generate recommendations for emergency tasks
     */
    public List<AssignmentRecommendation> generateEmergencyRecommendations(String taskId) {
        log.info("Generating emergency recommendations for task: {}", taskId);

        try {
            TaskProfile taskProfile = dataIntegrationService.getTaskProfile(taskId);
            List<UserProfile> emergencyCandidates = dataIntegrationService.getEmergencyCandidates(taskProfile);

            // Always use Gemini AI for emergency tasks
            try {
                List<AssignmentRecommendation> recommendations =
                    geminiRecommendationService.generateGeminiRecommendations(taskProfile, emergencyCandidates);
                return enhanceWithHybridScores(recommendations, taskProfile, emergencyCandidates);
            } catch (Exception e) {
                log.warn("Gemini AI failed for emergency task, using hybrid fallback: {}", e.getMessage());
                List<AssignmentRecommendation> recommendations =
                    hybridRecommendationAlgorithm.generateRecommendations(taskProfile, emergencyCandidates);
                return applyBasicTeamLeadPrioritization(recommendations, taskProfile, emergencyCandidates);
            }

        } catch (Exception e) {
            log.error("Error generating emergency recommendations for task: {}", taskId, e);
            throw new RuntimeException("Failed to generate emergency recommendations", e);
        }
    }

    /**
     * Generate team-based recommendations
     */
    public List<AssignmentRecommendation> generateTeamBasedRecommendations(String taskId, String teamId) {
        log.info("Generating team-based recommendations for task: {} and team: {}", taskId, teamId);

        try {
            TaskProfile taskProfile = dataIntegrationService.getTaskProfile(taskId);
            List<UserProfile> teamCandidates = dataIntegrationService.getTeamBasedCandidates(taskProfile, teamId);

            // Use Gemini AI for complex or high priority team tasks
            String priority = taskProfile.getPriority();
            boolean useGeminiAI = "HIGH".equalsIgnoreCase(priority) || "CRITICAL".equalsIgnoreCase(priority);

            if (useGeminiAI) {
                try {
                    List<AssignmentRecommendation> recommendations =
                        geminiRecommendationService.generateGeminiRecommendations(taskProfile, teamCandidates);
                    return enhanceWithHybridScores(recommendations, taskProfile, teamCandidates);
                } catch (Exception e) {
                    log.warn("Gemini AI failed for team task, using hybrid fallback: {}", e.getMessage());
                }
            }

            List<AssignmentRecommendation> recommendations =
                hybridRecommendationAlgorithm.generateRecommendations(taskProfile, teamCandidates);
            return applyBasicTeamLeadPrioritization(recommendations, taskProfile, teamCandidates);

        } catch (Exception e) {
            log.error("Error generating team-based recommendations for task: {} and team: {}", taskId, teamId, e);
            throw new RuntimeException("Failed to generate team-based recommendations", e);
        }
    }
}
