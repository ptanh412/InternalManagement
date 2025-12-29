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
import com.mnp.ai.dto.response.TaskResponse;
import com.mnp.ai.dto.response.UserProfileResponse;
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
