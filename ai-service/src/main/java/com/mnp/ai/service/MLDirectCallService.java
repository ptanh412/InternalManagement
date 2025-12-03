package com.mnp.ai.service;

import com.mnp.ai.dto.TaskAssignmentRequest;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Service for direct HTTP calls to ML service to handle response format mismatches
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MLDirectCallService {

    private final RestTemplate restTemplate;

    public List<AssignmentRecommendation> getMLRecommendations(
            TaskProfile taskProfile,
            List<AssignmentRecommendation> initialRecommendations) {

        try {
            // Build request matching ML service expectations
            TaskAssignmentRequest.TaskDetails taskDetails = TaskAssignmentRequest.TaskDetails.builder()
                    .taskId(taskProfile.getTaskId())
                    .title(taskProfile.getTitle())
                    .description(taskProfile.getDescription())
                    .priority(taskProfile.getPriority())
                    .difficulty(taskProfile.getDifficulty())
                    .estimatedHours(taskProfile.getEstimatedHours().doubleValue())
                    .requiredSkills(taskProfile.getRequiredSkills() != null ?
                        taskProfile.getRequiredSkills().keySet().stream().toList() : null)
                    .departmentId(taskProfile.getDepartment())
                    .projectId(taskProfile.getProjectId())
                    .isUrgent("HIGH".equals(taskProfile.getPriority()) || "CRITICAL".equals(taskProfile.getPriority()))
                    .complexity(mapDifficultyToComplexity(taskProfile.getDifficulty()))
                    .build();

            TaskAssignmentRequest request = TaskAssignmentRequest.builder()
                    .task(taskDetails)
                    .maxRecommendations(10)
                    .useAIRecommendations(true)
                    .priority(taskProfile.getPriority())
                    .build();

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<TaskAssignmentRequest> entity = new HttpEntity<>(request, headers);

            // Call ML service directly with proper error handling
            String mlServiceUrl = "http://localhost:8091/ml-service/ml/recommendations/task-assignment";

            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                mlServiceUrl,
                HttpMethod.POST,
                entity,
                (Class<Map<String, Object>>) (Class<?>) Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                log.info("ML Service response: {}", responseBody);

                // Convert the generic response to our format
                return convertToAssignmentRecommendations(responseBody, initialRecommendations);
            } else {
                log.warn("ML Service returned non-200 status: {} with body: {}",
                    response.getStatusCode(), response.getBody());
                return initialRecommendations;
            }

        } catch (Exception e) {
            log.error("Failed to call ML Service directly: {}", e.getMessage());
            return initialRecommendations;
        }
    }

    @SuppressWarnings("unchecked")
    private List<AssignmentRecommendation> convertToAssignmentRecommendations(
            Map<String, Object> responseBody,
            List<AssignmentRecommendation> fallback) {

        try {
            Boolean success = (Boolean) responseBody.get("success");
            String message = (String) responseBody.get("message");
            log.info("ML Service response - Success: {}, Message: {}", success, message);

            if (success == null || !success) {
                log.warn("ML Service returned unsuccessful response. Message: {}", message);
                return fallback;
            }

            List<Map<String, Object>> recommendations =
                (List<Map<String, Object>>) responseBody.get("recommendations");

            if (recommendations == null || recommendations.isEmpty()) {
                log.info("ML Service returned no recommendations");
                return fallback;
            }

            // Log ML service recommendations before conversion
            log.info("=== ML SERVICE RESPONSE RECEIVED BY AI SERVICE ===");
            log.info("Total ML Recommendations: {}", recommendations.size());
            for (int i = 0; i < recommendations.size(); i++) {
                Map<String, Object> rec = recommendations.get(i);
                log.info("ML_RECEIVED - Index: {}, UserID: {}, UserName: {}, Score: {}, Rank: {}",
                    i, rec.get("userId"), rec.get("userName"), rec.get("score"), rec.get("rank"));
            }
            log.info("=== END ML SERVICE RESPONSE ===");

            List<AssignmentRecommendation> convertedRecommendations = recommendations.stream()
                    .map(this::convertToAssignmentRecommendation)
                    .toList();

            // Log converted recommendations
            log.info("=== CONVERTED ML RECOMMENDATIONS IN AI SERVICE ===");
            for (AssignmentRecommendation rec : convertedRecommendations) {
                log.info("ML_CONVERTED - Rank: {}, UserID: {}, Score: {}",
                    rec.getRank(), rec.getUserId(), rec.getOverallScore());
            }
            log.info("=== END CONVERTED ML RECOMMENDATIONS ===");

            return convertedRecommendations;

        } catch (Exception e) {
            log.error("Error converting ML service response: {}", e.getMessage());
            return fallback;
        }
    }

    private AssignmentRecommendation convertToAssignmentRecommendation(Map<String, Object> item) {
        return AssignmentRecommendation.builder()
                .userId(getString(item, "userId"))
                .overallScore(getDouble(item, "score"))
                .rank(getInteger(item, "rank"))
                .recommendationReason(getString(item, "reason"))
                .matchedSkills(getStringList(item, "matchedSkills"))
                .missingSkills(getStringList(item, "missingSkills"))
                .skillMatchScore(getDouble(item, "skillMatchScore"))
                .performanceScore(getDouble(item, "performanceScore"))
                .availabilityScore(getDouble(item, "availabilityScore"))
                .workloadScore(getDouble(item, "workloadScore"))
                .build();
    }

    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return null;
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private List<String> getStringList(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof List) {
            return ((List<Object>) value).stream()
                    .map(Object::toString)
                    .toList();
        }
        return Collections.emptyList();
    }

    private String mapDifficultyToComplexity(String difficulty) {
        if (difficulty == null) return "MODERATE";
        return switch (difficulty.toUpperCase()) {
            case "EASY" -> "SIMPLE";
            case "MEDIUM" -> "MODERATE";
            case "HARD" -> "COMPLEX";
            default -> "MODERATE";
        };
    }
}
