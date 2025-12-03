package com.mnp.ai.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for handling ML service integration
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MLIntegrationService {

    private final MLDirectCallService mlDirectCallService;

    /**
     * Get ML-powered recommendations with accuracy scoring for HIGH/CRITICAL priority tasks
     */
    public List<AssignmentRecommendation> getMLRecommendations(
            TaskProfile taskProfile, List<AssignmentRecommendation> initialRecommendations) {
        log.info("Calling ML Service for enhanced recommendations accuracy for task: {}", taskProfile.getTaskId());

        try {
            // Call ML service directly
            return mlDirectCallService.getMLRecommendations(taskProfile, initialRecommendations);

        } catch (Exception e) {
            log.error("Failed to call ML Service for recommendations: {}", e.getMessage());
            log.info("Falling back to initial recommendations");
            return initialRecommendations;
        }
    }

    /**
     * Check if ML service is available
     */
    public boolean isMLServiceAvailable() {
        try {
            // Try a simple health check
            String mlServiceUrl = "http://localhost:8091/ml-service/actuator/health";
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(mlServiceUrl, String.class);
            return response != null && (response.contains("UP") || response.contains("\"status\":\"UP\""));
        } catch (Exception e) {
            log.debug("ML Service not available: {}", e.getMessage());
            return false;
        }
    }
}
