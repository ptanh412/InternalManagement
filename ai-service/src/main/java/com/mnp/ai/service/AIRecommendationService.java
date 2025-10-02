package com.mnp.ai.service;

import java.util.List;

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

    /**
     * Generate AI-powered task assignment recommendations
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

            // Generate hybrid recommendations using only the hybrid algorithm
            List<AssignmentRecommendation> recommendations =
                    hybridRecommendationAlgorithm.generateRecommendations(taskProfile, candidates);

            log.info("Generated {} recommendations for task: {}", recommendations.size(), taskId);
            return recommendations;

        } catch (Exception e) {
            log.error("Error generating recommendations for task: {}", taskId, e);
            throw new RuntimeException("Failed to generate recommendations", e);
        }
    }

    /**
     * Generate recommendations for emergency tasks
     */
    public List<AssignmentRecommendation> generateEmergencyRecommendations(String taskId) {
        log.info("Generating emergency recommendations for task: {}", taskId);

        try {
            TaskProfile taskProfile = dataIntegrationService.getTaskProfile(taskId);
            List<UserProfile> emergencyCandidates = dataIntegrationService.getEmergencyCandidates(taskProfile);

            return hybridRecommendationAlgorithm.generateRecommendations(taskProfile, emergencyCandidates);

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

            return hybridRecommendationAlgorithm.generateRecommendations(taskProfile, teamCandidates);

        } catch (Exception e) {
            log.error("Error generating team-based recommendations for task: {} and team: {}", taskId, teamId, e);
            throw new RuntimeException("Failed to generate team-based recommendations", e);
        }
    }
}
