package com.mnp.ai.service;

import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Dynamic Skill Threshold Calculator
 * Calculates minimum skill match threshold based on task characteristics and user profile
 *
 * This addresses the issue where minMatchThreshold = 0.0 was accepting all candidates
 * regardless of skill match, leading to inappropriate recommendations.
 *
 * Enhanced with:
 * - Skill normalization (handle synonyms)
 * - Category-based matching (transferability)
 * - AI embeddings (semantic similarity)
 */
@Component
@Slf4j
public class DynamicSkillThresholdCalculator {

    private final SkillNormalizer skillNormalizer;
    private final SkillCategoryMatcher skillCategoryMatcher;
    private final AISkillEmbeddingService aiSkillEmbeddingService;

    public DynamicSkillThresholdCalculator(SkillNormalizer skillNormalizer,
                                          SkillCategoryMatcher skillCategoryMatcher,
                                          AISkillEmbeddingService aiSkillEmbeddingService) {
        this.skillNormalizer = skillNormalizer;
        this.skillCategoryMatcher = skillCategoryMatcher;
        this.aiSkillEmbeddingService = aiSkillEmbeddingService;
    }

    // List of highly specialized domains requiring stricter skill matching
    private static final List<String> HIGHLY_SPECIALIZED_DOMAINS = Arrays.asList(
        "machine learning", "ml", "ai", "artificial intelligence",
        "deep learning", "tensorflow", "pytorch", "keras",
        "devops", "kubernetes", "docker orchestration",
        "security", "penetration testing", "cybersecurity",
        "blockchain", "smart contract", "web3",
        "embedded systems", "iot", "firmware",
        "game development", "unity", "unreal engine",
        "data science", "big data", "spark", "hadoop",
        "computer vision", "nlp", "natural language processing"
    );

    /**
     * Calculate dynamic minimum skill threshold
     *
     * @param task Task to be assigned
     * @param user User being evaluated
     * @return Threshold from 0.05 (5%) to 0.80 (80%)
     */
    public double calculateMinimumSkillThreshold(TaskProfile task, UserProfile user) {
        // Step 1: Base threshold by difficulty (with fallback to priority)
        double baseThreshold = getBaseThresholdByDifficulty(getDifficultyWithFallback(task));

        // Step 2: Adjust for seniority (seniors can learn faster)
        double seniorityAdjustment = getSeniorityAdjustment(getSeniorityLevel(user));

        // Step 3: Adjust for priority (urgent tasks need proven skills)
        double priorityAdjustment = getPriorityAdjustment(task.getPriority());

        // Step 4: Calculate tentative threshold
        double tentativeThreshold = baseThreshold + seniorityAdjustment + priorityAdjustment;

        // Step 5: Check for highly specialized tasks (always require minimum 50%)
        if (isHighlySpecialized(task)) {
            tentativeThreshold = Math.max(tentativeThreshold, 0.50);
        }

        // Step 6: Adjust for actual experience
        double experienceBonus = getExperienceBonus(user.getExperienceYears());
        tentativeThreshold -= experienceBonus;

        // Step 7: Adjust for workload (if busy → require higher match)
        double workloadPenalty = getWorkloadPenalty(getUtilization(user));
        tentativeThreshold += workloadPenalty;

        // Step 8: Clamp to reasonable range [0.05, 0.80]
        return clamp(tentativeThreshold, 0.05, 0.80);
    }

    /**
     * Base threshold by task difficulty
     */
    private double getBaseThresholdByDifficulty(String difficulty) {
        if (difficulty == null) {
            return 0.20; // Default 20%
        }

        return switch (difficulty.toUpperCase()) {
            case "EASY", "LOW" -> 0.10;         // 10% for easy tasks
            case "MEDIUM", "MODERATE" -> 0.20;  // 20% for medium tasks
            case "HARD", "HIGH" -> 0.40;        // 40% for hard tasks
            case "VERY_HARD", "EXPERT" -> 0.60; // 60% for very hard tasks
            default -> 0.20;                     // Default 20%
        };
    }

    /**
     * Adjustment for seniority level
     * Senior developers can learn faster → reduce requirements
     */
    private double getSeniorityAdjustment(int seniorityLevel) {
        return switch (seniorityLevel) {
            case 6 -> -0.15; // PRINCIPAL: -15%
            case 5 -> -0.12; // LEAD: -12%
            case 4 -> -0.10; // SENIOR: -10%
            case 3 -> -0.05; // MID: -5%
            case 2 -> 0.00;  // JUNIOR: no adjustment
            case 1 -> 0.05;  // INTERN: +5% (require more)
            default -> 0.00;
        };
    }

    /**
     * Adjustment for task priority
     * Urgent tasks need proven skills → increase requirements
     */
    private double getPriorityAdjustment(String priority) {
        if (priority == null) {
            return 0.00;
        }

        return switch (priority.toUpperCase()) {
            case "CRITICAL", "URGENT" -> 0.10;  // +10% for critical
            case "HIGH" -> 0.05;                 // +5% for high
            case "MEDIUM", "NORMAL" -> 0.00;     // No adjustment
            case "LOW" -> -0.05;                 // -5% for low (can learn)
            default -> 0.00;
        };
    }

    /**
     * Check if task requires highly specialized skills
     */
    private boolean isHighlySpecialized(TaskProfile task) {
        Map<String, Double> requiredSkills = task.getRequiredSkills();
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return false;
        }

        Set<String> skillNames = requiredSkills.keySet();

        return skillNames.stream()
            .anyMatch(skill -> HIGHLY_SPECIALIZED_DOMAINS.stream()
                .anyMatch(domain -> skill.toLowerCase().contains(domain.toLowerCase())));
    }

    /**
     * Experience bonus
     * More experienced developers learn faster
     */
    private double getExperienceBonus(Double yearsExperience) {
        if (yearsExperience == null) {
            return 0.00;
        }

        if (yearsExperience >= 10) {
            return 0.08; // -8% for experts (10+ years)
        } else if (yearsExperience >= 7) {
            return 0.06; // -6% for senior (7-10 years)
        } else if (yearsExperience >= 5) {
            return 0.04; // -4% for mid-senior (5-7 years)
        } else if (yearsExperience >= 3) {
            return 0.02; // -2% for mid (3-5 years)
        } else {
            return 0.00; // No bonus for junior
        }
    }

    /**
     * Workload penalty
     * Busy people don't have time to learn → require higher match
     */
    private double getWorkloadPenalty(double utilization) {
        if (utilization >= 0.85) {
            return 0.15; // +15% if workload ≥ 85% (too busy)
        } else if (utilization >= 0.70) {
            return 0.10; // +10% if workload ≥ 70% (busy)
        } else if (utilization >= 0.60) {
            return 0.05; // +5% if workload ≥ 60%
        } else {
            return 0.00; // No penalty if workload < 60% (has time)
        }
    }

    /**
     * Clamp value to range [min, max]
     */
    private double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(value, max));
    }

    /**
     * Get difficulty with fallback to priority-based estimation
     * If task.difficulty is null or empty, derive from priority and estimated hours
     */
    private String getDifficultyWithFallback(TaskProfile task) {
        String difficulty = task.getDifficulty();

        // If difficulty is explicitly set, use it
        if (difficulty != null && !difficulty.isEmpty()) {
            return difficulty;
        }

        // Fallback: Derive from priority and estimated hours
        String priority = task.getPriority();
        Integer estimatedHours = task.getEstimatedHours();

        int difficultyScore = 0;

        // Factor in estimated hours
        if (estimatedHours != null) {
            if (estimatedHours > 40) {
                difficultyScore += 2; // Very long task
            } else if (estimatedHours > 20) {
                difficultyScore += 1; // Long task
            }
        }

        // Factor in priority
        if (priority != null) {
            switch (priority.toUpperCase()) {
                case "CRITICAL", "URGENT" -> difficultyScore += 2;
                case "HIGH" -> difficultyScore += 1;
                case "MEDIUM" -> difficultyScore += 0;
                case "LOW" -> difficultyScore -= 1;
            }
        }

        // Map score to difficulty
        if (difficultyScore >= 3) return "HARD";
        if (difficultyScore >= 1) return "MEDIUM";
        if (difficultyScore >= 0) return "EASY";
        return "EASY"; // Default to easy
    }

    /**
     * Helper: Get seniority level from user profile
     * Now uses seniorityLevel field directly from identity-service
     */
    private int getSeniorityLevel(UserProfile user) {
        // First try to get from seniorityLevel field (from identity-service)
        String seniorityLevel = user.getSeniorityLevel();
        if (seniorityLevel != null) {
            return switch (seniorityLevel.toUpperCase()) {
                case "INTERN" -> 1;
                case "JUNIOR" -> 2;
                case "MID_LEVEL", "MID", "MIDDLE" -> 3;
                case "SENIOR" -> 4;
                case "LEAD", "TEAM_LEAD" -> 5;
                case "PRINCIPAL", "EXPERT" -> 6;
                default -> 3; // Default to MID_LEVEL
            };
        }

        // Fallback: Try to get from role field
        String role = user.getRole();
        if (role != null) {
            String roleUpper = role.toUpperCase();
            if (roleUpper.contains("PRINCIPAL") || roleUpper.contains("EXPERT")) {
                return 6; // PRINCIPAL
            } else if (roleUpper.contains("LEAD") || roleUpper.contains("TEAM_LEAD")) {
                return 5; // LEAD
            } else if (roleUpper.contains("SENIOR")) {
                return 4; // SENIOR
            } else if (roleUpper.contains("JUNIOR")) {
                return 2; // JUNIOR
            } else if (roleUpper.contains("INTERN")) {
                return 1; // INTERN
            }
        }

        // Final fallback: Use experience years
        Double experience = user.getExperienceYears();
        if (experience != null) {
            if (experience >= 10) return 6; // PRINCIPAL
            if (experience >= 7) return 5;  // LEAD
            if (experience >= 5) return 4;  // SENIOR
            if (experience >= 2) return 3;  // MID
            if (experience >= 1) return 2;  // JUNIOR
            return 1; // INTERN
        }

        return 3; // Default to MID_LEVEL
    }

    /**
     * Helper: Get utilization from user profile
     */
    private double getUtilization(UserProfile user) {
        Integer currentHours = user.getCurrentWorkLoadHours();
        if (currentHours == null) {
            return 0.5; // Default to 50%
        }

        // Assuming 40 hours per week as full capacity
        return Math.min(currentHours / 40.0, 1.0);
    }

    /**
     * Helper method: Explain threshold calculation
     * Used for logging/debugging
     */
    public String explainThreshold(TaskProfile task, UserProfile user, double threshold) {
        StringBuilder explanation = new StringBuilder();
        explanation.append(String.format("Skill Match Threshold: %.1f%%", threshold * 100));
        explanation.append("\n\nCalculation Details:");

        String difficulty = getDifficultyWithFallback(task);
        double base = getBaseThresholdByDifficulty(difficulty);
        explanation.append(String.format("\n- Base threshold (%s): %.1f%%",
            difficulty, base * 100));

        if (task.getDifficulty() == null || task.getDifficulty().isEmpty()) {
            explanation.append(" [derived from priority]");
        }

        int seniorityLevel = getSeniorityLevel(user);
        double seniority = getSeniorityAdjustment(seniorityLevel);
        explanation.append(String.format("\n- Seniority adjustment (level %d): %+.1f%%",
            seniorityLevel, seniority * 100));

        double priority = getPriorityAdjustment(task.getPriority());
        explanation.append(String.format("\n- Priority adjustment (%s): %+.1f%%",
            task.getPriority(), priority * 100));

        return explanation.toString();
    }

    /**
     * Calculate enhanced skill match using:
     * 1. AI Embeddings (if available) - semantic similarity
     * 2. Normalized matching (synonyms)
     * 3. Category-based matching (transferability)
     *
     * Returns enhanced match score (0.0 - 1.0)
     */
    public double calculateEnhancedSkillMatch(UserProfile user, TaskProfile task) {
        if (task.getRequiredSkills() == null || task.getRequiredSkills().isEmpty()) {
            return 1.0; // No skills required
        }

        if (user.getSkills() == null || user.getSkills().isEmpty()) {
            return 0.0; // User has no skills
        }

        Set<String> userSkills = user.getSkills().keySet();
        Set<String> requiredSkills = task.getRequiredSkills().keySet();

        // Try AI embeddings first (most sophisticated)
        AISkillEmbeddingService.AISkillMatchResult aiResult =
            aiSkillEmbeddingService.calculateEnhancedMatch(userSkills, requiredSkills);

        if (aiResult.usedAI) {
            // AI service available - use its sophisticated matching
            log.debug("Using AI-powered skill matching: {:.1f}%", aiResult.overallScore * 100);
            return aiResult.overallScore;
        }

        // Fallback to category-based matching
        log.debug("Using category-based skill matching (AI unavailable)");

        // 1. Normalized exact match (handles synonyms like JS → JavaScript)
        double normalizedMatch = skillNormalizer.calculateNormalizedMatch(userSkills, requiredSkills);

        // 2. Category-based transferability (e.g., React → Vue = high transferability)
        double transferability = skillCategoryMatcher.calculateTransferabilityScore(userSkills, requiredSkills);

        // Combine: 80% normalized match + 20% transferability
        // This gives more weight to exact matches but considers transferable skills
        return (0.8 * normalizedMatch) + (0.2 * transferability);
    }

    /**
     * Check if user qualifies for task using enhanced skill matching
     */
    public boolean isQualifiedWithEnhancedMatching(UserProfile user, TaskProfile task) {
        // Calculate dynamic threshold
        double minThreshold = calculateMinimumSkillThreshold(task, user);

        // Calculate enhanced skill match
        double skillMatch = calculateEnhancedSkillMatch(user, task);

        return skillMatch >= minThreshold;
    }

    /**
     * Get detailed match explanation with enhanced metrics
     */
    public String explainEnhancedMatch(UserProfile user, TaskProfile task) {
        Set<String> userSkills = user.getSkills() != null ? user.getSkills().keySet() : Set.of();
        Set<String> requiredSkills = task.getRequiredSkills() != null ? task.getRequiredSkills().keySet() : Set.of();

        // Try AI embeddings first
        AISkillEmbeddingService.AISkillMatchResult aiResult =
            aiSkillEmbeddingService.calculateEnhancedMatch(userSkills, requiredSkills);

        StringBuilder explanation = new StringBuilder();
        explanation.append("=== ENHANCED SKILL MATCHING ===\n");

        if (aiResult.usedAI) {
            // AI-powered explanation
            explanation.append("🤖 AI-Powered Semantic Matching\n");
            explanation.append(String.format("Exact Match: %.1f%%\n", aiResult.exactMatchScore * 100));
            explanation.append(String.format("Semantic Similarity: %.1f%%\n", aiResult.similarityMatchScore * 100));
            explanation.append(String.format("Overall AI Score: %.1f%%\n", aiResult.overallScore * 100));

            if (!aiResult.matchedSkills.isEmpty()) {
                explanation.append("Perfect Matches: ")
                    .append(String.join(", ", aiResult.matchedSkills))
                    .append("\n");
            }

            if (!aiResult.similarSkills.isEmpty()) {
                explanation.append("Transferable Skills (AI detected):\n");
                for (Map<String, Object> match : aiResult.similarSkills) {
                    explanation.append(String.format("  - %s ≈ %s (%.0f%% similar)\n",
                        match.get("required"),
                        match.get("user_has"),
                        getDoubleFromMap(match, "similarity") * 100));
                }
            }
        } else {
            // Fallback to category-based
            explanation.append("📊 Category-Based Matching (AI unavailable)\n");
            double normalizedMatch = skillNormalizer.calculateNormalizedMatch(userSkills, requiredSkills);
            double categoryMatch = skillCategoryMatcher.calculateCategoryMatch(userSkills, requiredSkills);
            double transferability = skillCategoryMatcher.calculateTransferabilityScore(userSkills, requiredSkills);

            explanation.append(String.format("Normalized Match (with synonyms): %.1f%%\n", normalizedMatch * 100));
            explanation.append(String.format("Category Match: %.1f%%\n", categoryMatch * 100));
            explanation.append(String.format("Transferability Score: %.1f%%\n", transferability * 100));

            // Add matched categories
            Set<String> matchedCategories = skillCategoryMatcher.getMatchedCategories(userSkills, requiredSkills);
            if (!matchedCategories.isEmpty()) {
                explanation.append("Matched Categories: ")
                    .append(String.join(", ", matchedCategories))
                    .append("\n");
            }

            // Add matched skills (normalized)
            Set<String> matchedSkills = skillNormalizer.getMatchedSkills(userSkills, requiredSkills);
            if (!matchedSkills.isEmpty()) {
                explanation.append("Matched Skills: ")
                    .append(String.join(", ", matchedSkills))
                    .append("\n");
            }

            // Add missing skills
            Set<String> missingSkills = skillNormalizer.getMissingSkills(userSkills, requiredSkills);
            if (!missingSkills.isEmpty()) {
                explanation.append("Missing Skills: ")
                    .append(String.join(", ", missingSkills))
                    .append("\n");
            }
        }

        double enhancedScore = calculateEnhancedSkillMatch(user, task);
        double threshold = calculateMinimumSkillThreshold(task, user);

        explanation.append(String.format("\nEnhanced Score: %.1f%%\n", enhancedScore * 100));
        explanation.append(String.format("Required Threshold: %.1f%%\n", threshold * 100));
        explanation.append(String.format("Qualified: %s\n", enhancedScore >= threshold ? "✅ YES" : "❌ NO"));

        if (isHighlySpecialized(task)) {
            explanation.append("\n⚠️ Highly specialized task: minimum 50% required");
        }

        double experience = getExperienceBonus(user.getExperienceYears());
        explanation.append(String.format("\n- Experience bonus (%.1f years): -%.1f%%",
            user.getExperienceYears() != null ? user.getExperienceYears() : 0.0,
            experience * 100));

        double workload = getWorkloadPenalty(getUtilization(user));
        explanation.append(String.format("\n- Workload penalty (%.0f%%): +%.1f%%",
            getUtilization(user) * 100, workload * 100));

        return explanation.toString();
    }

    private double getDoubleFromMap(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value instanceof Number ? ((Number) value).doubleValue() : 0.0;
    }
}

