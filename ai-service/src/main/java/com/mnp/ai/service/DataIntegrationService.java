package com.mnp.ai.service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.mnp.ai.client.ProfileServiceClient;
import com.mnp.ai.client.TaskServiceClient;
import com.mnp.ai.dto.TaskResponse;
import com.mnp.ai.dto.UserProfileResponse;
import com.mnp.ai.mapper.TaskProfileMapper;
import com.mnp.ai.mapper.UserProfileMapper;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

@Service
public class DataIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(DataIntegrationService.class);

    private final TaskServiceClient taskServiceClient;
    private final ProfileServiceClient profileServiceClient;
    private final TaskProfileMapper taskProfileMapper;
    private final UserProfileMapper userProfileMapper;
    private final DynamicSkillThresholdCalculator thresholdCalculator;
    private final SkillNormalizer skillNormalizer;
    private final SkillCategoryMatcher skillCategoryMatcher;

    @Autowired
    public DataIntegrationService(
            TaskServiceClient taskServiceClient,
            ProfileServiceClient profileServiceClient,
            TaskProfileMapper taskProfileMapper,
            UserProfileMapper userProfileMapper,
            DynamicSkillThresholdCalculator thresholdCalculator,
            SkillNormalizer skillNormalizer,
            SkillCategoryMatcher skillCategoryMatcher) {
        this.taskServiceClient = taskServiceClient;
        this.profileServiceClient = profileServiceClient;
        this.taskProfileMapper = taskProfileMapper;
        this.userProfileMapper = userProfileMapper;
        this.thresholdCalculator = thresholdCalculator;
        this.skillNormalizer = skillNormalizer;
        this.skillCategoryMatcher = skillCategoryMatcher;
    }

    /**
     * Get task profile from Task Service and convert to AI TaskProfile
     */
    public TaskProfile getTaskProfile(String taskId) {
        try {
            log.info("Fetching task profile for taskId: {}", taskId);

            // Fetch task data from task-service
            TaskResponse taskResponse = taskServiceClient.getTask(taskId);

            // Convert to AI TaskProfile using mapper
            TaskProfile taskProfile = taskProfileMapper.fromTaskResponse(taskResponse);

            // Enrich with AI-specific data
            taskProfile = enrichTaskProfileWithAIData(taskProfile);

            return taskProfile;
        } catch (Exception e) {
            log.error("Error fetching task profile for taskId: {}", taskId, e);
            throw new RuntimeException("Failed to fetch task profile", e);
        }
    }

    /**
     * Enrich TaskProfile with AI-specific data from various sources
     */
    private TaskProfile enrichTaskProfileWithAIData(TaskProfile taskProfile) {
        // Add complexity scoring based on task characteristics
        if (taskProfile.getComplexityScore() == null) {
            taskProfile.setComplexityScore(calculateComplexityScore(taskProfile));
        }

        // Add historical success rates for similar tasks
        Map<String, Double> skillSuccessRates = getSkillSuccessRatesForTaskType(taskProfile.getType());
        taskProfile.setSkillSuccessRate(skillSuccessRates);

        return taskProfile;
    }

    /**
     * Get smart candidates for a task based on AI filtering
     */
    public List<UserProfile> getSmartCandidates(TaskProfile task) {
        try {
            log.info("Fetching smart candidates for task: {}", task.getTaskId());

            // Get all available users from profile-service (now returns ApiResponse)
            var userResponseWrapper = profileServiceClient.getAllAvailableUsers();
            List<UserProfileResponse> userResponses = userResponseWrapper != null ? userResponseWrapper.getResult() : null;

            if (userResponses == null || userResponses.isEmpty()) {
                log.warn("No users available from profile service");
                return Collections.emptyList();
            }

            // Convert to AI UserProfile format
            List<UserProfile> candidates = userResponses.stream()
                    .map(userProfileMapper::fromUserProfileResponse)
                    .map(this::enrichUserProfileWithAIData)
                    .collect(Collectors.toList());

            // Apply smart filtering based on task requirements
//            candidates = applySmartFiltering(candidates, task);

            log.info("Found {} smart candidates for task: {}", candidates.size(), task.getTaskId());
            return candidates;

        } catch (Exception e) {
            log.error("Error fetching smart candidates for task: {}", task.getTaskId(), e);
            throw new RuntimeException("Failed to fetch smart candidates", e);
        }
    }

    /**
     * Enrich UserProfile with AI-specific metrics
     */
    private UserProfile enrichUserProfileWithAIData(UserProfile userProfile) {
        // Calculate availability score based on workload and status
        if (userProfile.getAvailabilityScore() == null) {
            userProfile.setAvailabilityScore(calculateAvailabilityScore(userProfile));
        }

        // Calculate workload capacity
        if (userProfile.getWorkloadCapacity() == null) {
            userProfile.setWorkloadCapacity(calculateWorkloadCapacity(userProfile));
        }

        return userProfile;
    }

    /**
     * Apply smart filtering to reduce candidate pool intelligently
     */
    private List<UserProfile> applySmartFiltering(List<UserProfile> candidates, TaskProfile task) {
        log.info("Applying smart filtering to {} candidates", candidates != null ? candidates.size() : 0);

        // First, remove duplicates based on userId but preserve order
        Map<String, UserProfile> uniqueMap = new LinkedHashMap<>();
        if (candidates != null) {
            for (UserProfile c : candidates) {
                if (c == null) continue;
                String uid = c.getUserId();
                if (uid == null) continue;
                // keep the first occurrence only
                uniqueMap.putIfAbsent(uid, c);
            }
        }

        List<UserProfile> uniqueCandidates = new ArrayList<>(uniqueMap.values());

        log.info("Removed duplicates: {} unique candidates from {} total", uniqueCandidates.size(),
                candidates != null ? candidates.size() : 0);

        int totalCandidates = uniqueCandidates.size();

        List<UserProfile> filteredCandidates = uniqueCandidates.stream()
                .filter(candidate -> {
                    if (candidate == null) return false;

                    // Debug log candidate info (defensive)
                    log.debug("Evaluating candidate: {} (userId: {}, status: {}, skills: {})",
                            candidate.getName(), candidate.getUserId(), candidate.getAvailabilityStatus(),
                            candidate.getSkills());

                    // Filter out system administrators and service accounts
                    if (isSystemAdministratorOrServiceAccount(candidate)) {
                        log.debug("Filtering out system administrator/service account: {}", candidate.getName());
                        return false;
                    }

                    // Lenient availability check
                    if (candidate.getAvailabilityStatus() != null
                            && "UNAVAILABLE".equalsIgnoreCase(candidate.getAvailabilityStatus())) {
                        log.debug("Filtering out candidate {} due to UNAVAILABLE status", candidate.getName());
                        return false;
                    }

                    // If task has no required skills, accept all candidates
                    if (task.getRequiredSkills() == null || task.getRequiredSkills().isEmpty()) {
                        log.debug("Task has no required skills, accepting candidate: {}", candidate.getName());
                        return true;
                    }

                    // Calculate skill match
                    double skillMatch = calculateBasicSkillMatch(task, candidate);

                    // Calculate dynamic threshold
                    double minMatchThreshold = thresholdCalculator.calculateMinimumSkillThreshold(task, candidate);

                    // Apply threshold
                    if (skillMatch < minMatchThreshold) {
                        log.info("❌ FILTERED OUT - Candidate: {} | Skill Match: {}% | Required Threshold: {}% | Task: {}",
                                candidate.getName(), Math.round(skillMatch * 10000.0) / 100.0,
                                Math.round(minMatchThreshold * 10000.0) / 100.0, task.getTaskId());

                        if (log.isDebugEnabled()) {
                            String explanation = thresholdCalculator.explainThreshold(task, candidate, minMatchThreshold);
                            log.debug("Rejection reason:\n{}", explanation);
                        }

                        return false;
                    }

                    log.info("✅ QUALIFIED - Candidate: {} | Skill Match: {}% | Required Threshold: {}% | Task: {}",
                            candidate.getName(), Math.round(skillMatch * 10000.0) / 100.0,
                            Math.round(minMatchThreshold * 10000.0) / 100.0, task.getTaskId());

                    return true;
                })
                .limit(50)
                .collect(Collectors.toList());

        // Summary logging (defensive)
        String priority = task.getPriority() != null ? task.getPriority() : "N/A";
        String difficulty = task.getDifficulty() != null ? task.getDifficulty() : "N/A";
        log.info("=== SMART FILTERING SUMMARY ===");
        log.info("Task: {} | Priority: {} | Difficulty: {}", task.getTaskId(), priority, difficulty);
        log.info("Total candidates: {}", totalCandidates);
        log.info("Qualified candidates: {}", filteredCandidates.size());
        log.info("Filtered out: {} ({}%)", totalCandidates - filteredCandidates.size(),
                totalCandidates > 0 ? ((totalCandidates - filteredCandidates.size()) * 100.0 / totalCandidates) : 0.0);
        log.info("==============================");

        return filteredCandidates;
    }

    /**
     * Check if a candidate is a system administrator or service account that should be excluded from task assignments
     */
    private boolean isSystemAdministratorOrServiceAccount(UserProfile candidate) {
        if (candidate.getName() != null) {
            String nameLower = candidate.getName().toLowerCase();
            if (nameLower.contains("system administrator")
                    || nameLower.contains("admin")
                    || nameLower.contains("service account")
                    || nameLower.equals("system")
                    || nameLower.equals("administrator")) {
                return true;
            }
        }

        if (candidate.getRole() != null) {
            String roleLower = candidate.getRole().toLowerCase();
            if (roleLower.contains("system administrator")
                    || roleLower.contains("system admin")
                    || roleLower.contains("service account")) {
                return true;
            }
        }

        // Check if it's a technical system account based on username patterns
        if (candidate.getUserId() != null) {
            String userId = candidate.getUserId().toLowerCase();
            return userId.contains("system") || userId.contains("admin") || userId.contains("service");
        }

        return false;
    }

    /**
     * Calculate basic skill match for filtering (case-insensitive)
     */
    private double calculateBasicSkillMatch(TaskProfile task, UserProfile candidate) {
        Map<String, Double> requiredSkills = task.getRequiredSkills();
        Map<String, Double> candidateSkills = candidate.getSkills();

        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return 1.0;
        }
        if (candidateSkills == null || candidateSkills.isEmpty()) {
            return 0.0;
        }

        // Normalize skill names
        Set<String> candidateSkillNames = skillNormalizer.normalizeSkills(candidateSkills.keySet());
        Set<String> requiredSkillNames = skillNormalizer.normalizeSkills(requiredSkills.keySet());

        // Exact matches
        Set<String> exactMatches = candidateSkillNames.stream()
                .filter(requiredSkillNames::contains)
                .collect(Collectors.toSet());

        // Substring / partial matches (e.g., 'restful api' vs 'restful api integration')
        Set<String> substringMatches = new java.util.HashSet<>();
        for (String req : requiredSkillNames) {
            if (exactMatches.contains(req)) continue;
            for (String cand : candidateSkillNames) {
                if (cand.contains(req) || req.contains(cand)) {
                    substringMatches.add(req);
                    break;
                }
            }
        }

        // Category-based partial matches
        Set<String> matchedCategories = skillCategoryMatcher.getMatchedCategories(candidateSkillNames, requiredSkillNames);
        Set<String> categoryMatches = new java.util.HashSet<>();
        if (!matchedCategories.isEmpty()) {
            // For each required skill, if its category is matched, mark as category match (but not double count)
            for (String req : requiredSkillNames) {
                if (exactMatches.contains(req) || substringMatches.contains(req)) continue;
                Set<String> reqCats = skillCategoryMatcher.getCategories(req);
                for (String c : reqCats) {
                    if (matchedCategories.contains(c)) {
                        categoryMatches.add(req);
                        break;
                    }
                }
            }
        }

        // Calculate weighted matched score
        double weightedMatched = 0.0;
        int totalRequired = requiredSkillNames.size();
        for (String req : requiredSkillNames) {
            if (exactMatches.contains(req)) {
                weightedMatched += 1.0; // full credit
            } else if (substringMatches.contains(req)) {
                weightedMatched += 0.7; // high partial credit
            } else if (categoryMatches.contains(req)) {
                weightedMatched += 0.5; // medium partial credit
            } else {
                // no match
            }
        }

        double matchRatio = weightedMatched / Math.max(1, totalRequired);

        // Also compute transferability and normalized exact ratio for combined scoring
        double normalizedExactRatio = skillNormalizer.calculateNormalizedMatch(candidateSkillNames, requiredSkillNames);
        double transferability = skillCategoryMatcher.calculateTransferabilityScore(candidateSkillNames, requiredSkillNames);

        // Combined score: favor exact/partial weighted matches first, then add small boost from transferability
        double combinedScore = (0.85 * matchRatio) + (0.10 * normalizedExactRatio) + (0.05 * transferability);

        // Log detailed debug
        log.debug("Skill match calculation for candidate {}: required={} , candidate={} , exact={}, substring={}, category={}, weightedMatched={}/{}, matchRatio={}",
                candidate.getName(), requiredSkillNames, candidateSkillNames, exactMatches, substringMatches, categoryMatches, weightedMatched, totalRequired, combinedScore);

        if (!exactMatches.isEmpty()) log.debug("  ✓ Exact matched skills: {}", exactMatches);
        if (!substringMatches.isEmpty()) log.debug("  ➜ Substring/partial matched skills: {}", substringMatches);
        if (!categoryMatches.isEmpty()) log.debug("  ⇄ Category-based matched skills: {}", categoryMatches);

        return combinedScore;
    }

    /**
     * Get emergency candidates (relaxed filtering for urgent tasks)
     */
    public List<UserProfile> getEmergencyCandidates(TaskProfile task) {
        try {
            log.info("Fetching emergency candidates for urgent task: {}", task.getTaskId());

            var userResponseWrapper = profileServiceClient.getAllUsers();
            List<UserProfileResponse> userResponses = userResponseWrapper != null ? userResponseWrapper.getResult() : null;

            if (userResponses == null || userResponses.isEmpty()) {
                log.warn("No users available from profile service for emergency candidates");
                return Collections.emptyList();
            }

            return userResponses.stream()
                    .map(userProfileMapper::fromUserProfileResponse)
                    .map(this::enrichUserProfileWithAIData)
                    .filter(candidate -> candidate.getAvailabilityScore() > 0.2) // Relaxed availability
                    .limit(20)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching emergency candidates for task: {}", task.getTaskId(), e);
            throw new RuntimeException("Failed to fetch emergency candidates", e);
        }
    }

    /**
     * Get team-based candidates for collaborative tasks
     */
    public List<UserProfile> getTeamBasedCandidates(TaskProfile task, String teamId) {
        try {
            log.info("Fetching team-based candidates for task: {} and team: {}", task.getTaskId(), teamId);

            var teamMembersWrapper = profileServiceClient.getTeamMembers(teamId);
            List<UserProfileResponse> teamMembers = teamMembersWrapper != null ? teamMembersWrapper.getResult() : null;

            if (teamMembers == null || teamMembers.isEmpty()) {
                log.warn("No team members found for teamId: {}", teamId);
                return Collections.emptyList();
            }

            return teamMembers.stream()
                    .map(userProfileMapper::fromUserProfileResponse)
                    .map(this::enrichUserProfileWithAIData)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Error fetching team-based candidates for task: {} and team: {}", task.getTaskId(), teamId, e);
            throw new RuntimeException("Failed to fetch team-based candidates", e);
        }
    }

    // Helper methods
    private double calculateComplexityScore(TaskProfile task) {
        double score = 0.0;

        // Factor in estimated hours
        if (task.getEstimatedHours() != null) {
            score += Math.min(task.getEstimatedHours() / 100.0, 0.4);
        }

        // Factor in required skills count
        if (task.getRequiredSkills() != null) {
            score += Math.min(task.getRequiredSkills().size() / 10.0, 0.3);
        }

        // Factor in priority
        if ("HIGH".equals(task.getPriority()) || "URGENT".equals(task.getPriority())) {
            score += 0.3;
        }

        return Math.min(score, 1.0);
    }

    private double calculateAvailabilityScore(UserProfile user) {
        if ("AVAILABLE".equals(user.getAvailabilityStatus())) {
            return 1.0;
        } else if ("BUSY".equals(user.getAvailabilityStatus())) {
            return 0.5;
        } else {
            return 0.1;
        }
    }

    private double calculateWorkloadCapacity(UserProfile user) {
        Integer currentHours = user.getCurrentWorkLoadHours();
        if (currentHours == null) return 0.5;

        // Assuming 40 hours per week as full capacity
        return Math.min(currentHours / 40.0, 1.0);
    }

    private Map<String, Double> getSkillSuccessRatesForTaskType(String taskType) {
        Map<String, Double> baseRates = new HashMap<>();
        baseRates.put("Java", 0.85);
        baseRates.put("Spring Boot", 0.90);
        baseRates.put("React", 0.80);
        baseRates.put("Database", 0.75);

        if (taskType != null && "DEVELOPMENT".equalsIgnoreCase(taskType)) {
            Map<String, Double> dev = new HashMap<>();
            dev.put("Java", 0.90);
            dev.put("Spring Boot", 0.95);
            dev.put("React", 0.85);
            dev.put("Database", 0.80);
            return dev;
        } else if (taskType != null && "TESTING".equalsIgnoreCase(taskType)) {
            Map<String, Double> test = new HashMap<>();
            test.put("Selenium", 0.85);
            test.put("Test Automation", 0.88);
            test.put("Manual Testing", 0.75);
            return test;
        }

        return baseRates;
    }
}
