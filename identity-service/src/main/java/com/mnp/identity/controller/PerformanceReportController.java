package com.mnp.identity.controller;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.response.PerformanceReportResponse;
import com.mnp.identity.service.PerformanceReportService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/performance")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PerformanceReportController {

    PerformanceReportService performanceReportService;

    /**
     * Generate individual performance report for a user
     */
    @GetMapping("/reports/{userId}")
    public ApiResponse<PerformanceReportResponse> getIndividualPerformanceReport(
            @PathVariable String userId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating performance report for user: {} with period: {}", userId, period);

        PerformanceReportResponse report = performanceReportService.generateIndividualPerformanceReport(userId, period);

        return ApiResponse.<PerformanceReportResponse>builder()
                .result(report)
                .message("Performance report generated successfully")
                .build();
    }

    /**
     * Get performance report for current authenticated user
     */
    @GetMapping("/reports/my-performance")
    public ApiResponse<PerformanceReportResponse> getMyPerformanceReport(
            @RequestParam(defaultValue = "MONTHLY") String period) {

        // In real implementation, get current user ID from security context
        String currentUserId = getCurrentUserId();

        log.info("Generating performance report for current user: {}", currentUserId);

        PerformanceReportResponse report = performanceReportService.generateIndividualPerformanceReport(currentUserId, period);

        return ApiResponse.<PerformanceReportResponse>builder()
                .result(report)
                .message("Your performance report generated successfully")
                .build();
    }

    /**
     * Get performance summary for multiple users (for managers)
     */
    @PostMapping("/reports/batch")
    public ApiResponse<java.util.List<PerformanceReportResponse>> getBatchPerformanceReports(
            @RequestBody java.util.List<String> userIds,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating batch performance reports for {} users", userIds.size());

        java.util.List<PerformanceReportResponse> reports = userIds.stream()
                .map(userId -> performanceReportService.generateIndividualPerformanceReport(userId, period))
                .collect(java.util.stream.Collectors.toList());

        return ApiResponse.<java.util.List<PerformanceReportResponse>>builder()
                .result(reports)
                .message("Batch performance reports generated successfully")
                .build();
    }

    /**
     * Get department performance overview
     */
    @GetMapping("/reports/department/{departmentId}")
    public ApiResponse<java.util.List<PerformanceReportResponse>> getDepartmentPerformanceReports(
            @PathVariable String departmentId,
            @RequestParam(defaultValue = "MONTHLY") String period) {

        log.info("Generating department performance reports for department: {}", departmentId);

        // In real implementation, fetch all users from the department
        java.util.List<String> departmentUserIds = fetchDepartmentUserIds(departmentId);

        java.util.List<PerformanceReportResponse> reports = departmentUserIds.stream()
                .map(userId -> performanceReportService.generateIndividualPerformanceReport(userId, period))
                .collect(java.util.stream.Collectors.toList());

        return ApiResponse.<java.util.List<PerformanceReportResponse>>builder()
                .result(reports)
                .message("Department performance reports generated successfully")
                .build();
    }

    private String getCurrentUserId() {
        // In real implementation, extract from security context
        // var context = SecurityContextHolder.getContext();
        // return context.getAuthentication().getName();
        return "current-user-id"; // Placeholder
    }

    private java.util.List<String> fetchDepartmentUserIds(String departmentId) {
        // In real implementation, query database for department users
        return java.util.Arrays.asList("user1", "user2", "user3"); // Placeholder
    }
}
