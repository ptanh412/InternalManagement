package com.mnp.ai.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.mnp.ai.dto.response.ApiResponse;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.service.AIRecommendationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai/recommendations")
@RequiredArgsConstructor
@Slf4j
public class RecommendationController {

    private final AIRecommendationService aiRecommendationService;

    /**
     * Generate AI-powered task assignment recommendations
     */
    @PostMapping("/task/{taskId}")
    public ApiResponse<List<AssignmentRecommendation>> generateTaskRecommendations(@PathVariable String taskId) {

        log.info("Received request for task recommendations for taskId: {}", taskId);

        List<AssignmentRecommendation> recommendations =
                aiRecommendationService.generateTaskAssignmentRecommendations(taskId);

        return ApiResponse.<List<AssignmentRecommendation>>builder()
                .result(recommendations)
                .build();
    }

    /**
     * Generate emergency task recommendations with relaxed criteria
     */
    @PostMapping("/task/{taskId}/emergency")
    public ApiResponse<List<AssignmentRecommendation>> generateEmergencyRecommendations(@PathVariable String taskId) {

        log.info("Received request for emergency recommendations for taskId: {}", taskId);

        List<AssignmentRecommendation> recommendations =
                aiRecommendationService.generateEmergencyRecommendations(taskId);

        return ApiResponse.<List<AssignmentRecommendation>>builder()
                .result(recommendations)
                .build();
    }

    /**
     * Generate team-based recommendations for collaborative tasks
     */
    @PostMapping("/task/{taskId}/team/{teamId}")
    public ApiResponse<List<AssignmentRecommendation>> generateTeamRecommendations(
            @PathVariable String taskId, @PathVariable String teamId) {

        log.info("Received request for team recommendations for taskId: {} and teamId: {}", taskId, teamId);

        List<AssignmentRecommendation> recommendations =
                aiRecommendationService.generateTeamBasedRecommendations(taskId, teamId);

        return ApiResponse.<List<AssignmentRecommendation>>builder()
                .result(recommendations)
                .build();
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.<String>builder()
                .result("AI Recommendation Service is running")
                .build();
    }
}
