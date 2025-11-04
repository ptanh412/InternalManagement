package com.mnp.identity.controller;

import org.springframework.web.bind.annotation.*;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.PerformanceUpdateRequest;
import com.mnp.identity.dto.response.PerformanceDetailsResponse;
import com.mnp.identity.service.PerformanceCalculationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PerformanceController {

    PerformanceCalculationService performanceCalculationService;

    /**
     * Update performance score after task review
     */
    @PostMapping("/update")
    public ApiResponse<Double> updatePerformanceScore(@RequestBody PerformanceUpdateRequest request) {
        log.info("Updating performance score for user: {}", request.getUserId());
        
        Double updatedScore = performanceCalculationService.updatePerformanceScoreAfterTaskReview(request);
        
        return ApiResponse.<Double>builder()
                .result(updatedScore)
                .build();
    }

    /**
     * Recalculate performance score based on all task metrics
     */
    @PostMapping("/recalculate/{userId}")
    public ApiResponse<Double> recalculatePerformanceScore(@PathVariable String userId) {
        log.info("Recalculating performance score for user: {}", userId);
        
        Double updatedScore = performanceCalculationService.calculateAndUpdatePerformanceScore(userId);
        
        return ApiResponse.<Double>builder()
                .result(updatedScore)
                .build();
    }

    /**
     * Get current performance score
     */
    @GetMapping("/score/{userId}")
    public ApiResponse<Double> getPerformanceScore(@PathVariable String userId) {
        Double score = performanceCalculationService.getUserPerformanceScore(userId);
        
        return ApiResponse.<Double>builder()
                .result(score)
                .build();
    }

    /**
     * Get detailed performance metrics for a user
     */
    @GetMapping("/details/{userId}")
    public ApiResponse<PerformanceDetailsResponse> getPerformanceDetails(@PathVariable String userId) {
        PerformanceDetailsResponse details = performanceCalculationService.getUserPerformanceDetails(userId);
        
        return ApiResponse.<PerformanceDetailsResponse>builder()
                .result(details)
                .build();
    }

    /**
     * Batch recalculate all performance scores (admin only)
     */
    @PostMapping("/recalculate-all")
    public ApiResponse<String> recalculateAllPerformanceScores() {
        log.info("Starting batch recalculation of all performance scores");
        
        // Run asynchronously to avoid timeout
        new Thread(() -> performanceCalculationService.recalculateAllPerformanceScores()).start();
        
        return ApiResponse.<String>builder()
                .result("Batch recalculation started")
                .build();
    }
}