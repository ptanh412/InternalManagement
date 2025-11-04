package com.mnp.workload.controller;

import com.mnp.workload.dto.request.ApiResponse;
import com.mnp.workload.dto.response.WorkTimeStatisticsResponse;
import com.mnp.workload.service.WorkTimeStatisticsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
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
     * Get department work time overview
     */
    @GetMapping("/statistics/department/{departmentId}")
    public ApiResponse<List<WorkTimeStatisticsResponse>> getDepartmentWorkTimeStatistics(
            @PathVariable String departmentId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating department work time statistics for department: {}", departmentId);

        List<String> departmentUserIds = fetchDepartmentUserIds(departmentId);

        List<WorkTimeStatisticsResponse> statistics = departmentUserIds.stream()
                .map(userId -> workTimeStatisticsService.generateWorkTimeStatistics(userId, period))
                .collect(Collectors.toList());

        return ApiResponse.<List<WorkTimeStatisticsResponse>>builder()
                .result(statistics)
                .message("Department work time statistics generated successfully")
                .build();
    }

    /**
     * Get team productivity metrics
     */
    @GetMapping("/productivity/team/{teamId}")
    public ApiResponse<TeamProductivitySummary> getTeamProductivityMetrics(
            @PathVariable String teamId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating team productivity metrics for team: {}", teamId);

        List<String> teamUserIds = fetchTeamUserIds(teamId);
        List<WorkTimeStatisticsResponse> teamStatistics = teamUserIds.stream()
                .map(userId -> workTimeStatisticsService.generateWorkTimeStatistics(userId, period))
                .collect(Collectors.toList());

        TeamProductivitySummary summary = calculateTeamProductivitySummary(teamStatistics);

        return ApiResponse.<TeamProductivitySummary>builder()
                .result(summary)
                .message("Team productivity metrics generated successfully")
                .build();
    }

    private String getCurrentUserId() {
        // In real implementation, extract from security context
        return "current-user-id";
    }

    private List<String> fetchDepartmentUserIds(String departmentId) {
        // In real implementation, query database
        return List.of("user1", "user2", "user3");
    }

    private List<String> fetchTeamUserIds(String teamId) {
        // In real implementation, query database
        return List.of("user1", "user2", "user3", "user4");
    }

    private TeamProductivitySummary calculateTeamProductivitySummary(List<WorkTimeStatisticsResponse> teamStatistics) {
        double avgHoursPerWeek = teamStatistics.stream()
                .mapToDouble(WorkTimeStatisticsResponse::getAverageHoursPerWeek)
                .average().orElse(0.0);

        double avgProductivity = teamStatistics.stream()
                .mapToDouble(WorkTimeStatisticsResponse::getProductiveHoursPercentage)
                .average().orElse(0.0);

        return TeamProductivitySummary.builder()
                .teamSize(teamStatistics.size())
                .averageWeeklyHours(avgHoursPerWeek)
                .averageProductivityPercentage(avgProductivity)
                .totalTeamHours(teamStatistics.stream().mapToDouble(WorkTimeStatisticsResponse::getTotalHoursThisMonth).sum())
                .build();
    }

    // Inner class for team summary
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TeamProductivitySummary {
        private Integer teamSize;
        private Double averageWeeklyHours;
        private Double averageProductivityPercentage;
        private Double totalTeamHours;
    }
}
