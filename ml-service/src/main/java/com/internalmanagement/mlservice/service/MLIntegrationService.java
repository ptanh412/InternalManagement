package com.internalmanagement.mlservice.service;

import com.internalmanagement.mlservice.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Service for integrating ML training with the existing ai-service
 * This bridges the gap between ML model training and real-time recommendations
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MLIntegrationService {

    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8089}")
    private String aiServiceUrl;

    @Value("${profile.service.url:http://localhost:8081}")
    private String profileServiceUrl;

    @Value("${task.service.url:http://localhost:8084}")
    private String taskServiceUrl;

    /**
     * Get real task assignment recommendations from ai-service
     * This calls the actual HybridRecommendationAlgorithm with Gemini AI
     */
    public RecommendationResponseDto getAITaskRecommendations(String taskId) {
        log.info("Getting AI recommendations for task: {}", taskId);

        try {
            String url = aiServiceUrl + "/ai/recommendations/task/" + taskId;

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");

            ResponseEntity<AIRecommendationResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(headers),
                    AIRecommendationResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return convertAIResponseToMLResponse(response.getBody(), taskId);
            } else {
                log.error("Failed to get AI recommendations for task {}: {}", taskId, response.getStatusCode());
                return createErrorResponse(taskId, "AI service returned error: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error calling AI service for task {}: {}", taskId, e.getMessage());
            return createErrorResponse(taskId, "Error calling AI service: " + e.getMessage());
        }
    }

    /**
     * Trigger model retraining in ai-service after ML training completes
     */
    public void notifyModelUpdate(String trainingId, ModelPerformanceDto performance) {
        log.info("Notifying ai-service of model update from training: {}", trainingId);

        try {
            String url = aiServiceUrl + "/ai/models/update";

            ModelUpdateNotification notification = ModelUpdateNotification.builder()
                    .trainingId(trainingId)
                    .accuracy(performance.getAccuracy())
                    .f1Score(performance.getF1Score())
                    .lastUpdated(performance.getLastUpdated())
                    .sampleSize(performance.getSampleSize())
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");

            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(notification, headers),
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Successfully notified ai-service of model update");
            } else {
                log.warn("Failed to notify ai-service of model update: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error notifying ai-service of model update: {}", e.getMessage());
        }
    }

    /**
     * Get task profile from task-service for ML training
     */
    public TaskProfileDto getTaskProfile(String taskId) {
        log.info("Getting task profile for: {}", taskId);

        try {
            String url = taskServiceUrl + "/api/tasks/" + taskId;

            ResponseEntity<TaskProfileDto> response = restTemplate.getForEntity(
                    url,
                    TaskProfileDto.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            } else {
                log.error("Failed to get task profile for {}: {}", taskId, response.getStatusCode());
                return null;
            }

        } catch (Exception e) {
            log.error("Error getting task profile for {}: {}", taskId, e.getMessage());
            return null;
        }
    }

    /**
     * Get user profiles from profile-service for ML training
     */
    public List<UserProfileDto> getUserProfiles(List<String> userIds) {
        log.info("Getting user profiles for {} users", userIds.size());

        try {
            String url = profileServiceUrl + "/api/profiles/batch";

            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");

            ResponseEntity<List> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(userIds, headers),
                    List.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return (List<UserProfileDto>) response.getBody();
            } else {
                log.error("Failed to get user profiles: {}", response.getStatusCode());
                return List.of();
            }

        } catch (Exception e) {
            log.error("Error getting user profiles: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Validate that ML training data aligns with current system data
     */
    public DataAlignmentDto validateDataAlignment() {
        log.info("Validating ML training data alignment with system data");

        try {
            // Check data freshness from different services
            boolean taskDataFresh = checkTaskDataFreshness();
            boolean profileDataFresh = checkProfileDataFreshness();
            boolean workloadDataFresh = checkWorkloadDataFreshness();

            return DataAlignmentDto.builder()
                    .taskDataAligned(taskDataFresh)
                    .profileDataAligned(profileDataFresh)
                    .workloadDataAligned(workloadDataFresh)
                    .overallAlignment(taskDataFresh && profileDataFresh && workloadDataFresh)
                    .lastChecked(LocalDateTime.now())
                    .build();

        } catch (Exception e) {
            log.error("Error validating data alignment: {}", e.getMessage());
            return DataAlignmentDto.builder()
                    .taskDataAligned(false)
                    .profileDataAligned(false)
                    .workloadDataAligned(false)
                    .overallAlignment(false)
                    .lastChecked(LocalDateTime.now())
                    .error(e.getMessage())
                    .build();
        }
    }

    /**
     * Helper methods
     */
    private RecommendationResponseDto convertAIResponseToMLResponse(AIRecommendationResponse aiResponse, String taskId) {
        return RecommendationResponseDto.builder()
                .success(true)
                .requestId("ml-req-" + System.currentTimeMillis())
                .taskId(taskId)
                .recommendations(convertAIRecommendationsToML(aiResponse.getResult()))
                .totalCandidates(aiResponse.getResult().size())
                .generatedAt(LocalDateTime.now())
                .algorithm("hybrid_with_gemini_ai")
                .confidence(calculateAverageScore(aiResponse.getResult()))
                .message("Recommendations from AI service with Gemini AI enhancement")
                .build();
    }

    private List<RecommendationItemDto> convertAIRecommendationsToML(List<Map<String, Object>> aiRecommendations) {
        return aiRecommendations.stream()
                .map(this::convertSingleAIRecommendation)
                .toList();
    }

    private RecommendationItemDto convertSingleAIRecommendation(Map<String, Object> aiRec) {
        return RecommendationItemDto.builder()
                .userId((String) aiRec.get("userId"))
                .userName((String) aiRec.get("userName"))
                .userEmail((String) aiRec.get("userEmail"))
                .score(((Number) aiRec.get("totalScore")).doubleValue())
                .rank(((Number) aiRec.get("rank")).intValue())
                .reason((String) aiRec.get("geminiReasoning"))
                .skillMatchScore(((Number) aiRec.get("skillMatchScore")).doubleValue())
                .performanceScore(((Number) aiRec.get("performanceScore")).doubleValue())
                .availabilityScore(((Number) aiRec.get("availabilityScore")).doubleValue())
                .workloadScore(((Number) aiRec.get("workloadScore")).doubleValue())
                .build();
    }

    private Double calculateAverageScore(List<Map<String, Object>> recommendations) {
        if (recommendations.isEmpty()) return 0.0;
        return recommendations.stream()
                .mapToDouble(rec -> ((Number) rec.get("totalScore")).doubleValue())
                .average()
                .orElse(0.0);
    }

    private RecommendationResponseDto createErrorResponse(String taskId, String errorMessage) {
        return RecommendationResponseDto.builder()
                .success(false)
                .requestId("ml-req-" + System.currentTimeMillis())
                .taskId(taskId)
                .recommendations(List.of())
                .totalCandidates(0)
                .generatedAt(LocalDateTime.now())
                .algorithm("error")
                .confidence(0.0)
                .message(errorMessage)
                .build();
    }

    private boolean checkTaskDataFreshness() {
        // Check if task data in ML training database is recent
        return true; // Implementation would check actual data timestamps
    }

    private boolean checkProfileDataFreshness() {
        // Check if profile data in ML training database is recent
        return true; // Implementation would check actual data timestamps
    }

    private boolean checkWorkloadDataFreshness() {
        // Check if workload data in ML training database is recent
        return true; // Implementation would check actual data timestamps
    }
}
