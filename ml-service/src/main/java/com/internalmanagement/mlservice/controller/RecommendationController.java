package com.internalmanagement.mlservice.controller;

import com.internalmanagement.mlservice.dto.*;
import com.internalmanagement.mlservice.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * REST controller for ML recommendation endpoints
 */
@RestController
@RequestMapping("/api/ml/recommendations")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    /**
     * Get task assignment recommendations
     */
    @PostMapping("/task-assignment")
    public ResponseEntity<RecommendationResponseDto> getTaskAssignmentRecommendations(
            @Valid @RequestBody TaskAssignmentRequestDto request) {
        
        log.info("Received recommendation request for task: {}", request.getTask().getTaskId());
        
        try {
            RecommendationResponseDto response = recommendationService
                    .getTaskAssignmentRecommendations(request);
            
            log.info("Generated {} recommendations for task {}", 
                    response.getRecommendations().size(), 
                    request.getTask().getTaskId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to generate recommendations for task {}: {}", 
                     request.getTask().getTaskId(), e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(RecommendationResponseDto.builder()
                            .success(false)
                            .message("Failed to generate recommendations: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get user performance predictions
     */
    @PostMapping("/performance-prediction")
    public ResponseEntity<PerformancePredictionDto> predictUserPerformance(
            @Valid @RequestBody PerformancePredictionRequestDto request) {
        
        log.info("Received performance prediction request for user: {} and task: {}", 
                request.getUserId(), request.getTaskId());
        
        try {
            PerformancePredictionDto prediction = recommendationService
                    .predictUserPerformance(request);
            
            return ResponseEntity.ok(prediction);
            
        } catch (Exception e) {
            log.error("Failed to predict performance for user {} and task {}: {}", 
                     request.getUserId(), request.getTaskId(), e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(PerformancePredictionDto.builder()
                            .success(false)
                            .message("Failed to predict performance: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Submit recommendation feedback
     */
    @PostMapping("/feedback")
    public ResponseEntity<FeedbackResponseDto> submitRecommendationFeedback(
            @Valid @RequestBody RecommendationFeedbackDto feedback) {
        
        log.info("Received feedback for task: {} and user: {}", 
                feedback.getTaskId(), feedback.getUserId());
        
        try {
            FeedbackResponseDto response = recommendationService
                    .submitRecommendationFeedback(feedback);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to submit feedback: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(FeedbackResponseDto.builder()
                            .success(false)
                            .message("Failed to submit feedback: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get recommendation explanations
     */
    @GetMapping("/explain/{taskId}/{userId}")
    public ResponseEntity<RecommendationExplanationDto> explainRecommendation(
            @PathVariable String taskId,
            @PathVariable String userId) {
        
        log.info("Received explanation request for task: {} and user: {}", taskId, userId);
        
        try {
            RecommendationExplanationDto explanation = recommendationService
                    .explainRecommendation(taskId, userId);
            
            return ResponseEntity.ok(explanation);
            
        } catch (Exception e) {
            log.error("Failed to generate explanation: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(RecommendationExplanationDto.builder()
                            .success(false)
                            .message("Failed to generate explanation: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get similar tasks for recommendation context
     */
    @GetMapping("/similar-tasks/{taskId}")
    public ResponseEntity<List<SimilarTaskDto>> getSimilarTasks(@PathVariable String taskId) {
        
        log.info("Finding similar tasks for: {}", taskId);
        
        try {
            List<SimilarTaskDto> similarTasks = recommendationService.findSimilarTasks(taskId);
            
            return ResponseEntity.ok(similarTasks);
            
        } catch (Exception e) {
            log.error("Failed to find similar tasks: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get user recommendation history
     */
    @GetMapping("/history/{userId}")
    public ResponseEntity<UserRecommendationHistoryDto> getUserRecommendationHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        log.info("Getting recommendation history for user: {}", userId);
        
        try {
            UserRecommendationHistoryDto history = recommendationService
                    .getUserRecommendationHistory(userId, page, size);
            
            return ResponseEntity.ok(history);
            
        } catch (Exception e) {
            log.error("Failed to get recommendation history: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Validate recommendation model availability
     */
    @GetMapping("/model/status")
    public ResponseEntity<ModelStatusDto> getModelStatus() {
        
        try {
            ModelStatusDto status = recommendationService.getModelStatus();
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("Failed to get model status: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ModelStatusDto.builder()
                            .available(false)
                            .message("Failed to check model status: " + e.getMessage())
                            .build());
        }
    }
}