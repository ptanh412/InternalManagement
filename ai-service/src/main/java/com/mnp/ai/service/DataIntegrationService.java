package com.mnp.ai.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mnp.ai.client.ProfileServiceClient;
import com.mnp.ai.client.TaskServiceClient;
import com.mnp.ai.dto.TaskResponse;
import com.mnp.ai.dto.UserProfileResponse;
import com.mnp.ai.mapper.TaskProfileMapper;
import com.mnp.ai.mapper.UserProfileMapper;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataIntegrationService {

    private final TaskServiceClient taskServiceClient;
    private final ProfileServiceClient profileServiceClient;
    private final TaskProfileMapper taskProfileMapper;
    private final UserProfileMapper userProfileMapper;

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
            List<UserProfileResponse> userResponses = userResponseWrapper.getResult();

            if (userResponses == null || userResponses.isEmpty()) {
                log.warn("No users available from profile service");
                return List.of();
            }

            // Convert to AI UserProfile format
            List<UserProfile> candidates = userResponses.stream()
                    .map(userProfileMapper::fromUserProfileResponse)
                    .map(this::enrichUserProfileWithAIData)
                    .collect(Collectors.toList());

            // Apply smart filtering based on task requirements
            candidates = applySmartFiltering(candidates, task);

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
        log.info("Applying smart filtering to {} candidates", candidates.size());

        List<UserProfile> filteredCandidates = candidates.stream()
                .filter(candidate -> {
                    // Debug log candidate info
                    log.debug(
                            "Evaluating candidate: {} (userId: {}, status: {}, skills: {})",
                            candidate.getName(),
                            candidate.getUserId(),
                            candidate.getAvailabilityStatus(),
                            candidate.getSkills());

                    // More lenient availability check - accept AVAILABLE, BUSY, or null status
                    if (candidate.getAvailabilityStatus() != null
                            && "UNAVAILABLE".equals(candidate.getAvailabilityStatus())) {
                        log.debug("Filtering out candidate {} due to UNAVAILABLE status", candidate.getName());
                        return false;
                    }

                    // More lenient skill match check (at least 10% match or no required skills)
                    double skillMatch = calculateBasicSkillMatch(task, candidate);
                    if (task.getRequiredSkills() != null
                            && !task.getRequiredSkills().isEmpty()
                            && skillMatch < 0.1) {
                        log.debug(
                                "Filtering out candidate {} due to low skill match: {}",
                                candidate.getName(),
                                skillMatch);
                        return false;
                    }

                    return true;
                })
                .limit(50) // Limit to top 50 candidates for performance
                .collect(Collectors.toList());

        log.info(
                "After filtering: {} candidates remaining from {} original candidates",
                filteredCandidates.size(),
                candidates.size());

        return filteredCandidates;
    }

    /**
     * Calculate basic skill match for filtering
     */
    private double calculateBasicSkillMatch(TaskProfile task, UserProfile candidate) {
        Map<String, Double> requiredSkills = task.getRequiredSkills();
        Map<String, Double> candidateSkills = candidate.getSkills();

        if (requiredSkills == null
                || requiredSkills.isEmpty()
                || candidateSkills == null
                || candidateSkills.isEmpty()) {
            return 0.0;
        }

        int matchedSkills = 0;
        for (String skill : requiredSkills.keySet()) {
            if (candidateSkills.containsKey(skill)) {
                matchedSkills++;
            }
        }

        double matchRatio = (double) matchedSkills / requiredSkills.size();

        // Add debug logging to help troubleshoot
        log.debug(
                "Skill match calculation for candidate {}: required={}, candidate={}, matched={}/{}, ratio={}",
                candidate.getName(),
                requiredSkills.keySet(),
                candidateSkills.keySet(),
                matchedSkills,
                requiredSkills.size(),
                matchRatio);

        return matchRatio;
    }

    /**
     * Get emergency candidates (relaxed filtering for urgent tasks)
     */
    public List<UserProfile> getEmergencyCandidates(TaskProfile task) {
        try {
            log.info("Fetching emergency candidates for urgent task: {}", task.getTaskId());

            var userResponseWrapper = profileServiceClient.getAllUsers();
            List<UserProfileResponse> userResponses = userResponseWrapper.getResult();

            if (userResponses == null || userResponses.isEmpty()) {
                log.warn("No users available from profile service for emergency candidates");
                return List.of();
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
            List<UserProfileResponse> teamMembers = teamMembersWrapper.getResult();

            if (teamMembers == null || teamMembers.isEmpty()) {
                log.warn("No team members found for teamId: {}", teamId);
                return List.of();
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
        // This could be enhanced with actual historical data
        return Map.of(
                "Java", 0.85,
                "Spring Boot", 0.90,
                "React", 0.80,
                "Database", 0.75);
    }
}
