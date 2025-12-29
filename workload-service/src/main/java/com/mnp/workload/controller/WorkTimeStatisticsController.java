package com.mnp.workload.controller;

import com.mnp.workload.dto.request.ApiResponse;
import com.mnp.workload.dto.response.WorkTimeStatisticsResponse;
import com.mnp.workload.exception.AppException;
import com.mnp.workload.exception.ErrorCode;
import com.mnp.workload.service.WorkTimeStatisticsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/work-time")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WorkTimeStatisticsController {

    WorkTimeStatisticsService workTimeStatisticsService;

    /**
     * Get work time statistics for a specific user
     */
    @GetMapping("/statistics/{userId}")
    public ApiResponse<WorkTimeStatisticsResponse> getUserWorkTimeStatistics(
            @PathVariable String userId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating work time statistics for user: {} with period: {}", userId, period);

        WorkTimeStatisticsResponse statistics = workTimeStatisticsService.generateWorkTimeStatistics(userId, period);

        return ApiResponse.<WorkTimeStatisticsResponse>builder()
                .result(statistics)
                .message("Work time statistics generated successfully")
                .build();
    }

    /**
     * Get work time statistics for current authenticated user
     */
    @GetMapping("/statistics/my-time")
    public ApiResponse<WorkTimeStatisticsResponse> getMyWorkTimeStatistics(
            @RequestParam(defaultValue = "MONTHLY") String period) {

        String currentUserId = getCurrentUserId();
        log.info("Generating work time statistics for current user: {}", currentUserId);

        WorkTimeStatisticsResponse statistics = workTimeStatisticsService.generateWorkTimeStatistics(currentUserId, period);

        return ApiResponse.<WorkTimeStatisticsResponse>builder()
                .result(statistics)
                .message("Your work time statistics generated successfully")
                .build();
    }

    /**
     * Get work time statistics for multiple users
     */
    @PostMapping("/statistics/batch")
    public ApiResponse<List<WorkTimeStatisticsResponse>> getBatchWorkTimeStatistics(
            @RequestBody List<String> userIds,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating batch work time statistics for {} users", userIds.size());

        List<WorkTimeStatisticsResponse> statistics = userIds.stream()
                .map(userId -> workTimeStatisticsService.generateWorkTimeStatistics(userId, period))
                .collect(Collectors.toList());

        return ApiResponse.<List<WorkTimeStatisticsResponse>>builder()
                .result(statistics)
                .message("Batch work time statistics generated successfully")
                .build();
    }

    /**
     * Get project work time overview
     */
    @GetMapping("/statistics/project/{projectId}")
    public ApiResponse<List<WorkTimeStatisticsResponse>> getProjectWorkTimeStatistics(
            @PathVariable String projectId,
            @RequestParam String period) {

        log.info("Generating project work time statistics for project: {}", projectId);

        List<WorkTimeStatisticsResponse> statistics = 
            workTimeStatisticsService.generateProjectWorkTimeStatistics(projectId, period);

        return ApiResponse.<List<WorkTimeStatisticsResponse>>builder()
                .result(statistics)
                .message("Project work time statistics generated successfully")
                .build();
    }

    /**
     * Get project productivity metrics
     */
    @GetMapping("/productivity/project/{projectId}")
    public ApiResponse<ProjectProductivitySummary> getProjectProductivityMetrics(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating project productivity metrics for project: {}", projectId);

        List<WorkTimeStatisticsResponse> projectStatistics = 
            workTimeStatisticsService.generateProjectWorkTimeStatistics(projectId, period);

        ProjectProductivitySummary summary = calculateProjectProductivitySummary(projectStatistics);

        return ApiResponse.<ProjectProductivitySummary>builder()
                .result(summary)
                .message("Project productivity metrics generated successfully")
                .build();
    }

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }

    private ProjectProductivitySummary calculateProjectProductivitySummary(List<WorkTimeStatisticsResponse> projectStatistics) {
        double avgHoursPerWeek = projectStatistics.stream()
                .mapToDouble(WorkTimeStatisticsResponse::getAverageHoursPerWeek)
                .average().orElse(0.0);

        double avgProductivity = projectStatistics.stream()
                .mapToDouble(WorkTimeStatisticsResponse::getProductiveHoursPercentage)
                .average().orElse(0.0);

        return ProjectProductivitySummary.builder()
                .projectMemberCount(projectStatistics.size())
                .averageWeeklyHours(avgHoursPerWeek)
                .averageProductivityPercentage(avgProductivity)
                .totalProjectHours(projectStatistics.stream().mapToDouble(WorkTimeStatisticsResponse::getTotalHoursThisMonth).sum())
                .build();
    }

    // Inner class for project productivity summary
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProjectProductivitySummary {
        private Integer projectMemberCount;
        private Double averageWeeklyHours;
        private Double averageProductivityPercentage;
        private Double totalProjectHours;
    }
}
