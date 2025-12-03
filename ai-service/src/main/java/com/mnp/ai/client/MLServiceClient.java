package com.mnp.ai.client;

import com.mnp.ai.configuration.FeignConfiguration;
import com.mnp.ai.dto.MLPredictionRequest;
import com.mnp.ai.dto.MLPredictionResponse;
import com.mnp.ai.dto.TaskAssignmentRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.mnp.ai.dto.MLRecommendationResponse;

/**
 * Feign client for calling ML Service for recommendation accuracy
 */
@FeignClient(
        name = "ml-service",
        url = "${app.services.ml}",
//        fallback = MLServiceFallback.class,
        configuration = FeignConfiguration.class)
public interface MLServiceClient {

    /**
     * Get ML-powered recommendations with accuracy scoring for HIGH/CRITICAL priority tasks
     */
    @PostMapping("/ml/recommendations/task-assignment")
    MLRecommendationResponse getMLRecommendations(@RequestBody TaskAssignmentRequest request);

    /**
     * Predict candidate suitability scores using hybrid ML model
     */
    @PostMapping("/api/ml/predict-candidates")
    MLPredictionResponse predictCandidates(@RequestBody MLPredictionRequest request);

    /**
     * Get ML service health status
     */
    @GetMapping("/actuator/health")
    String getHealthStatus();
}
