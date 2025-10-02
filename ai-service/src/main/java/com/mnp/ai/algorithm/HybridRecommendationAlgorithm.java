package com.mnp.ai.algorithm;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class HybridRecommendationAlgorithm {

    // Weights for hybrid approach
    private static final double CONTENT_BASED_WEIGHT = 0.6;
    private static final double COLLABORATIVE_FILTERING_WEIGHT = 0.4;

    // Individual criteria weights for content-based filtering
    private static final double SKILL_MATCH_WEIGHT = 0.35;
    private static final double PERFORMANCE_WEIGHT = 0.25;
    private static final double AVAILABILITY_WEIGHT = 0.20;
    private static final double WORKLOAD_WEIGHT = 0.15;
    private static final double COLLABORATION_WEIGHT = 0.05;

    /**
     * Generate hybrid recommendations combining content-based and collaborative filtering
     */
    public List<AssignmentRecommendation> generateRecommendations(TaskProfile task, List<UserProfile> candidates) {

        log.info(
                "Generating hybrid recommendations for task: {} with {} candidates",
                task.getTaskId(),
                candidates.size());

        // Remove duplicates based on userId
        List<UserProfile> uniqueCandidates = candidates.stream()
                .collect(Collectors.toMap(
                        UserProfile::getUserId,
                        candidate -> candidate,
                        (existing, replacement) -> existing)) // Keep first occurrence
                .values()
                .stream()
                .collect(Collectors.toList());

        log.info("Removed duplicates: {} unique candidates from {} total", uniqueCandidates.size(), candidates.size());

        List<AssignmentRecommendation> recommendations = new ArrayList<>();

        for (UserProfile candidate : uniqueCandidates) {
            AssignmentRecommendation recommendation = new AssignmentRecommendation();
            recommendation.setUserId(candidate.getUserId());
            recommendation.setTaskId(task.getTaskId());

            // Content-Based Filtering Score
            double contentBasedScore = calculateContentBasedScore(task, candidate);
            recommendation.setContentBasedScore(contentBasedScore);

            // Collaborative Filtering Score
            double collaborativeScore = calculateCollaborativeFilteringScore(task, candidate, uniqueCandidates);
            recommendation.setCollaborativeFilteringScore(collaborativeScore);

            // Hybrid Score (weighted combination)
            double hybridScore =
                    (CONTENT_BASED_WEIGHT * contentBasedScore) + (COLLABORATIVE_FILTERING_WEIGHT * collaborativeScore);
            recommendation.setHybridScore(hybridScore);
            recommendation.setOverallScore(hybridScore);

            // Calculate individual criteria scores for transparency
            recommendation.setSkillMatchScore(calculateSkillMatchScore(task, candidate));
            recommendation.setPerformanceScore(calculatePerformanceScore(candidate));
            recommendation.setAvailabilityScore(candidate.getAvailabilityScore());
            recommendation.setWorkloadScore(calculateWorkloadScore(candidate));
            recommendation.setCollaborationScore(calculateCollaborationScore(candidate));

            // Generate recommendation reason
            recommendation.setRecommendationReason(generateRecommendationReason(recommendation, task, candidate));

            recommendations.add(recommendation);
        }

        // Sort by hybrid score (descending), then by availability score as secondary sort
        recommendations.sort((r1, r2) -> {
            int hybridCompare = Double.compare(r2.getHybridScore(), r1.getHybridScore());
            if (hybridCompare != 0) {
                return hybridCompare;
            }
            // Secondary sort by availability score if hybrid scores are equal
            return Double.compare(r2.getAvailabilityScore(), r1.getAvailabilityScore());
        });

        // Assign ranks
        for (int i = 0; i < recommendations.size(); i++) {
            recommendations.get(i).setRank(i + 1);
        }

        // Limit to top 10 recommendations to avoid overwhelming results
        List<AssignmentRecommendation> topRecommendations =
                recommendations.stream().limit(10).collect(Collectors.toList());

        log.info("Generated {} hybrid recommendations for task: {}", topRecommendations.size(), task.getTaskId());
        return topRecommendations;
    }

    /**
     * Content-Based Filtering: Match candidate profile with task requirements
     */
    private double calculateContentBasedScore(TaskProfile task, UserProfile candidate) {
        double skillMatchScore = calculateSkillMatchScore(task, candidate);
        double performanceScore = calculatePerformanceScore(candidate);
        double availabilityScore = candidate.getAvailabilityScore() != null ? candidate.getAvailabilityScore() : 0.5;
        double workloadScore = calculateWorkloadScore(candidate);
        double collaborationScore = calculateCollaborationScore(candidate);

        return (SKILL_MATCH_WEIGHT * skillMatchScore)
                + (PERFORMANCE_WEIGHT * performanceScore)
                + (AVAILABILITY_WEIGHT * availabilityScore)
                + (WORKLOAD_WEIGHT * workloadScore)
                + (COLLABORATION_WEIGHT * collaborationScore);
    }

    /**
     * Collaborative Filtering: Find similar users and their assignment success
     */
    private double calculateCollaborativeFilteringScore(
            TaskProfile task, UserProfile candidate, List<UserProfile> allCandidates) {
        // Find similar users based on skill profiles
        List<UserProfile> similarUsers = findSimilarUsers(candidate, allCandidates, 5);

        if (similarUsers.isEmpty()) {
            return 0.5; // Default score when no similar users found
        }

        // Calculate average success rate of similar users for similar tasks
        double totalScore = 0.0;
        int validScores = 0;

        for (UserProfile similarUser : similarUsers) {
            double similarity = calculateUserSimilarity(candidate, similarUser);
            double taskTypeScore = calculateTaskTypeSuccessRate(similarUser, task.getTaskType());

            if (taskTypeScore > 0) {
                totalScore += similarity * taskTypeScore;
                validScores++;
            }
        }

        return validScores > 0 ? totalScore / validScores : 0.5;
    }

    /**
     * Find users similar to the candidate based on skills and performance
     */
    private List<UserProfile> findSimilarUsers(UserProfile candidate, List<UserProfile> allUsers, int topK) {
        return allUsers.stream()
                .filter(user -> !user.getUserId().equals(candidate.getUserId()))
                .map(user -> new AbstractMap.SimpleEntry<>(user, calculateUserSimilarity(candidate, user)))
                .filter(entry -> entry.getValue() > 0.3) // Minimum similarity threshold
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                .limit(topK)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    /**
     * Calculate similarity between two users based on skills and experience
     */
    private double calculateUserSimilarity(UserProfile user1, UserProfile user2) {
        // Skill similarity using cosine similarity
        double skillSimilarity = calculateSkillSimilarity(
                user1.getSkills() != null ? user1.getSkills() : new HashMap<>(),
                user2.getSkills() != null ? user2.getSkills() : new HashMap<>());

        // Performance similarity
        double perf1 = user1.getPerformanceRating() != null ? user1.getPerformanceRating() : 2.5;
        double perf2 = user2.getPerformanceRating() != null ? user2.getPerformanceRating() : 2.5;
        double performanceSimilarity = 1.0 - Math.abs(perf1 - perf2) / 5.0;

        // Experience similarity
        double exp1 = user1.getExperienceYears() != null ? user1.getExperienceYears() : 0.0;
        double exp2 = user2.getExperienceYears() != null ? user2.getExperienceYears() : 0.0;
        double experienceSimilarity = 1.0 - Math.abs(exp1 - exp2) / 10.0;

        return (0.6 * skillSimilarity) + (0.25 * performanceSimilarity) + (0.15 * experienceSimilarity);
    }

    /**
     * Calculate cosine similarity between two skill sets
     */
    private double calculateSkillSimilarity(Map<String, Double> skills1, Map<String, Double> skills2) {
        Set<String> allSkills = new HashSet<>(skills1.keySet());
        allSkills.addAll(skills2.keySet());

        if (allSkills.isEmpty()) {
            return 0.0;
        }

        double dotProduct = 0.0;
        double norm1 = 0.0;
        double norm2 = 0.0;

        for (String skill : allSkills) {
            double value1 = skills1.getOrDefault(skill, 0.0);
            double value2 = skills2.getOrDefault(skill, 0.0);

            dotProduct += value1 * value2;
            norm1 += value1 * value1;
            norm2 += value2 * value2;
        }

        if (norm1 == 0.0 || norm2 == 0.0) {
            return 0.0;
        }

        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Calculate success rate for a user on specific task types
     */
    private double calculateTaskTypeSuccessRate(UserProfile user, String taskType) {
        Map<String, Double> taskTypeSuccess = user.getTaskTypeSuccessRates();
        if (taskTypeSuccess == null || taskTypeSuccess.isEmpty()) {
            return user.getTaskCompletionRate(); // Fallback to overall completion rate
        }

        return taskTypeSuccess.getOrDefault(taskType, user.getTaskCompletionRate());
    }

    /**
     * Calculate skill match score between task requirements and candidate skills
     */
    private double calculateSkillMatchScore(TaskProfile task, UserProfile candidate) {
        Map<String, Double> requiredSkills = task.getRequiredSkills();
        Map<String, Double> candidateSkills = candidate.getSkills();

        // If candidate has no skills, return very low score
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.05;
        }

        // If task has specific skill requirements, use exact matching
        if (requiredSkills != null && !requiredSkills.isEmpty()) {
            return calculateExactSkillMatch(requiredSkills, candidateSkills, task, candidate);
        }

        // If no specific skills required, evaluate based on task type and department
        return calculateTaskTypeAndDepartmentMatch(task, candidate);
    }

    /**
     * Calculate exact skill match when task has specific skill requirements
     */
    private double calculateExactSkillMatch(
            Map<String, Double> requiredSkills,
            Map<String, Double> candidateSkills,
            TaskProfile task,
            UserProfile candidate) {
        double totalScore = 0.0;
        int totalSkills = requiredSkills.size();
        int matchedSkills = 0;

        // Check each required skill
        for (Map.Entry<String, Double> requiredSkill : requiredSkills.entrySet()) {
            String skillName = requiredSkill.getKey().toLowerCase().trim();
            double requiredLevel = requiredSkill.getValue();

            // Find matching skill in candidate's skills
            Double candidateLevel = findMatchingSkill(skillName, candidateSkills);

            if (candidateLevel != null && candidateLevel > 0) {
                matchedSkills++;
                if (candidateLevel >= requiredLevel) {
                    totalScore += 1.0; // Perfect match
                } else {
                    totalScore += candidateLevel / requiredLevel; // Partial match
                }
            }
            // No score if candidate doesn't have the skill
        }

        double baseScore = totalScore / totalSkills;

        // Apply bonuses for task type and department alignment
        double taskTypeBonus = calculateTaskTypeAlignment(task, candidate);
        double departmentBonus = calculateDepartmentAlignment(task, candidate);

        // Final score with bonuses (max 1.0)
        double finalScore = Math.min(1.0, baseScore + (taskTypeBonus * 0.1) + (departmentBonus * 0.1));

        log.debug(
                "Skill match for candidate {}: base={}, taskType={}, dept={}, final={}",
                candidate.getUserId(),
                baseScore,
                taskTypeBonus,
                departmentBonus,
                finalScore);

        return finalScore;
    }

    /**
     * Find matching skill in candidate's skills using flexible matching
     */
    private Double findMatchingSkill(String requiredSkill, Map<String, Double> candidateSkills) {
        String required = requiredSkill.toLowerCase().trim();

        // Direct match
        if (candidateSkills.containsKey(required)) {
            return candidateSkills.get(required);
        }

        // Flexible matching for common variations
        for (Map.Entry<String, Double> candidateSkill : candidateSkills.entrySet()) {
            String candidateSkillName = candidateSkill.getKey().toLowerCase().trim();

            // Exact match
            if (candidateSkillName.equals(required)) {
                return candidateSkill.getValue();
            }

            // Contains match (e.g., "react" matches "reactjs")
            if (candidateSkillName.contains(required) || required.contains(candidateSkillName)) {
                return candidateSkill.getValue();
            }

            // Common skill aliases
            if (areSkillsEquivalent(required, candidateSkillName)) {
                return candidateSkill.getValue();
            }
        }

        return null; // No match found
    }

    /**
     * Check if two skills are equivalent (handle common aliases)
     */
    private boolean areSkillsEquivalent(String skill1, String skill2) {
        // Frontend skill equivalencies
        if ((skill1.equals("react") && skill2.equals("reactjs"))
                || (skill1.equals("reactjs") && skill2.equals("react"))) {
            return true;
        }
        if ((skill1.equals("javascript") && skill2.equals("js"))
                || (skill1.equals("js") && skill2.equals("javascript"))) {
            return true;
        }
        if ((skill1.equals("ui/ux") && skill2.contains("ui")) || (skill2.equals("ui/ux") && skill1.contains("ui"))) {
            return true;
        }
        if ((skill1.equals("socket.io") && skill2.contains("socket"))
                || (skill2.equals("socket.io") && skill1.contains("socket"))) {
            return true;
        }

        // Backend skill equivalencies
        if ((skill1.equals("spring boot") && skill2.equals("spring"))
                || (skill1.equals("spring") && skill2.equals("spring boot"))) {
            return true;
        }
        if ((skill1.equals("mysql") && skill2.equals("sql")) || (skill1.equals("sql") && skill2.equals("mysql"))) {
            return true;
        }

        return false;
    }

    /**
     * Calculate task type and department match when no specific skills are defined
     */
    private double calculateTaskTypeAndDepartmentMatch(TaskProfile task, UserProfile candidate) {
        double score = 0.3; // Base score

        // Task type alignment
        double taskTypeScore = calculateTaskTypeAlignment(task, candidate);

        // Department alignment
        double departmentScore = calculateDepartmentAlignment(task, candidate);

        // Overall skill quality (but weighted less than specific matching)
        double skillQualityScore = calculateOverallSkillQuality(candidate.getSkills()) * 0.3;

        return Math.min(1.0, score + (taskTypeScore * 0.4) + (departmentScore * 0.2) + skillQualityScore);
    }

    /**
     * Calculate alignment between task type and candidate's skills
     */
    private double calculateTaskTypeAlignment(TaskProfile task, UserProfile candidate) {
        String taskType = task.getTaskType();
        if (taskType == null) {
            return 0.0;
        }

        Map<String, Double> candidateSkills = candidate.getSkills();
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.0;
        }

        switch (taskType.toUpperCase()) {
            case "FRONTEND_DEVELOPMENT":
                return calculateFrontendSkillAlignment(candidateSkills);
            case "BACKEND_DEVELOPMENT":
                return calculateBackendSkillAlignment(candidateSkills);
            case "FULLSTACK_DEVELOPMENT":
                return Math.max(
                        calculateFrontendSkillAlignment(candidateSkills),
                        calculateBackendSkillAlignment(candidateSkills));
            case "QA_TESTING":
                return calculateQASkillAlignment(candidateSkills);
            case "DEVOPS":
                return calculateDevOpsSkillAlignment(candidateSkills);
            default:
                return 0.5; // Neutral score for unknown task types
        }
    }

    private double calculateFrontendSkillAlignment(Map<String, Double> skills) {
        double score = 0.0;
        int count = 0;

        String[] frontendSkills = {
            "react",
            "reactjs",
            "javascript",
            "js",
            "html",
            "css",
            "html/css",
            "ui/ux",
            "ui",
            "ux",
            "vue",
            "angular",
            "typescript",
            "socket.io"
        };

        for (String frontendSkill : frontendSkills) {
            for (Map.Entry<String, Double> candidateSkill : skills.entrySet()) {
                if (candidateSkill.getKey().toLowerCase().contains(frontendSkill)
                        || frontendSkill.contains(candidateSkill.getKey().toLowerCase())) {
                    score += candidateSkill.getValue() / 5.0; // Normalize to 0-1
                    count++;
                    break; // Avoid double counting
                }
            }
        }

        return count > 0 ? Math.min(1.0, score / count) : 0.0;
    }

    private double calculateBackendSkillAlignment(Map<String, Double> skills) {
        double score = 0.0;
        int count = 0;

        String[] backendSkills = {
            "java",
            "spring",
            "spring boot",
            "python",
            "node",
            "nodejs",
            "mysql",
            "postgresql",
            "mongodb",
            "sql",
            "docker",
            "kubernetes"
        };

        for (String backendSkill : backendSkills) {
            for (Map.Entry<String, Double> candidateSkill : skills.entrySet()) {
                if (candidateSkill.getKey().toLowerCase().contains(backendSkill)
                        || backendSkill.contains(candidateSkill.getKey().toLowerCase())) {
                    score += candidateSkill.getValue() / 5.0; // Normalize to 0-1
                    count++;
                    break; // Avoid double counting
                }
            }
        }

        return count > 0 ? Math.min(1.0, score / count) : 0.0;
    }

    private double calculateQASkillAlignment(Map<String, Double> skills) {
        String[] qaSkills = {"testing", "automation", "selenium", "junit", "testng", "qa", "quality"};
        return calculateSkillCategoryAlignment(skills, qaSkills);
    }

    private double calculateDevOpsSkillAlignment(Map<String, Double> skills) {
        String[] devopsSkills = {"docker", "kubernetes", "jenkins", "aws", "azure", "devops", "ci/cd"};
        return calculateSkillCategoryAlignment(skills, devopsSkills);
    }

    private double calculateSkillCategoryAlignment(Map<String, Double> skills, String[] categorySkills) {
        double score = 0.0;
        int count = 0;

        for (String categorySkill : categorySkills) {
            for (Map.Entry<String, Double> candidateSkill : skills.entrySet()) {
                if (candidateSkill.getKey().toLowerCase().contains(categorySkill)) {
                    score += candidateSkill.getValue() / 5.0;
                    count++;
                    break;
                }
            }
        }

        return count > 0 ? Math.min(1.0, score / count) : 0.0;
    }

    /**
     * Calculate alignment between task department and candidate's department
     */
    private double calculateDepartmentAlignment(TaskProfile task, UserProfile candidate) {
        String taskDepartment = task.getDepartment();
        String candidateDepartment = candidate.getDepartment();

        if (taskDepartment == null || candidateDepartment == null) {
            return 0.5; // Neutral score if department info is missing
        }

        taskDepartment = taskDepartment.toLowerCase().trim();
        candidateDepartment = candidateDepartment.toLowerCase().trim();

        // Exact match
        if (taskDepartment.equals(candidateDepartment)) {
            return 1.0;
        }

        // Partial matches for common department aliases
        if ((taskDepartment.contains("fe") || taskDepartment.contains("frontend"))
                && (candidateDepartment.contains("fe") || candidateDepartment.contains("frontend"))) {
            return 1.0;
        }

        if ((taskDepartment.contains("be") || taskDepartment.contains("backend"))
                && (candidateDepartment.contains("be") || candidateDepartment.contains("backend"))) {
            return 1.0;
        }

        return 0.2; // Low score for department mismatch
    }

    /**
     * Calculate overall skill quality when no specific skills are required
     */
    private double calculateOverallSkillQuality(Map<String, Double> candidateSkills) {
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.1; // Minimum score for no skills
        }

        // Calculate average skill level
        double averageSkillLevel = candidateSkills.values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(1.0);

        // Skill diversity bonus (more skills = better)
        int skillCount = candidateSkills.size();
        double diversityBonus = Math.min(skillCount / 10.0, 0.3); // Max 30% bonus for having many skills

        // Advanced skill bonus (higher level skills get more credit)
        double advancedSkillBonus = candidateSkills.values().stream()
                .mapToDouble(level -> level >= 4.0 ? 0.1 : (level >= 3.0 ? 0.05 : 0.0))
                .sum();
        advancedSkillBonus = Math.min(advancedSkillBonus, 0.2); // Max 20% bonus

        // Normalize average skill level to 0-1 scale (assuming skills are 1-5 scale)
        double normalizedSkillLevel = Math.min(averageSkillLevel / 5.0, 1.0);

        // Combine all factors
        double overallQuality = normalizedSkillLevel + diversityBonus + advancedSkillBonus;

        // Ensure result is between 0.1 and 1.0
        return Math.max(0.1, Math.min(1.0, overallQuality));
    }

    /**
     * Calculate performance score based on ratings and completion rate
     */
    private double calculatePerformanceScore(UserProfile candidate) {
        double performanceRating = candidate.getPerformanceRating() != null
                ? candidate.getPerformanceRating() / 5.0
                : 0.5; // Normalize to 0-1
        double completionRate = candidate.getTaskCompletionRate();

        return (0.7 * performanceRating) + (0.3 * completionRate);
    }

    /**
     * Calculate workload score (higher score for lower current workload)
     */
    private double calculateWorkloadScore(UserProfile candidate) {
        Double workloadCapacity = candidate.getWorkloadCapacity();
        return workloadCapacity != null ? Math.max(0.0, 1.0 - workloadCapacity) : 0.5;
    }

    /**
     * Calculate collaboration score based on team interaction history
     */
    private double calculateCollaborationScore(UserProfile candidate) {
        Map<String, Double> collaborationHistory = candidate.getCollaborationHistory();
        if (collaborationHistory == null || collaborationHistory.isEmpty()) {
            return 0.5; // Default neutral score
        }

        return collaborationHistory.values().stream()
                .mapToDouble(Double::doubleValue)
                .average()
                .orElse(0.5);
    }

    /**
     * Generate human-readable recommendation reason
     */
    private String generateRecommendationReason(
            AssignmentRecommendation recommendation, TaskProfile task, UserProfile candidate) {
        StringBuilder reason = new StringBuilder();

        // Analyze skill match
        if (recommendation.getSkillMatchScore() > 0.8) {
            reason.append("Excellent skill match (")
                    .append(String.format("%.0f%%", recommendation.getSkillMatchScore() * 100))
                    .append("). ");
        } else if (recommendation.getSkillMatchScore() > 0.6) {
            reason.append("Good skill alignment (")
                    .append(String.format("%.0f%%", recommendation.getSkillMatchScore() * 100))
                    .append("). ");
        }

        // Analyze performance
        if (recommendation.getPerformanceScore() > 0.8) {
            reason.append("Outstanding performance history. ");
        } else if (recommendation.getPerformanceScore() > 0.6) {
            reason.append("Solid performance track record. ");
        }

        // Analyze availability
        if (recommendation.getAvailabilityScore() > 0.8) {
            reason.append("High availability. ");
        } else if (recommendation.getAvailabilityScore() > 0.6) {
            reason.append("Good availability. ");
        }

        // Analyze workload
        if (recommendation.getWorkloadScore() > 0.7) {
            reason.append("Optimal current workload. ");
        }

        // Overall assessment
        if (recommendation.getOverallScore() > 0.8) {
            reason.append("Top-tier candidate with excellent fit.");
        } else if (recommendation.getOverallScore() > 0.6) {
            reason.append("Strong candidate with good overall alignment.");
        } else {
            reason.append("Suitable candidate based on hybrid analysis.");
        }

        return reason.toString();
    }
}
