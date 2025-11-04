package com.mnp.project.controller;

import com.mnp.project.dto.response.ProjectProgressResponse;
import com.mnp.project.service.ProjectProgressTrackingService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projects/progress")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProjectProgressController {

    ProjectProgressTrackingService projectProgressTrackingService;

    /**
     * Get comprehensive progress report for a specific project
     */
    @GetMapping("/{projectId}")
    public ApiResponse<ProjectProgressResponse> getProjectProgress(@PathVariable String projectId) {
        log.info("Generating project progress report for project: {}", projectId);

        ProjectProgressResponse progress = projectProgressTrackingService.getProjectProgress(projectId);

        return ApiResponse.<ProjectProgressResponse>builder()
                .result(progress)
                .message("Project progress report generated successfully")
                .build();
    }

    /**
     * Get progress overview for all projects
     */
    @GetMapping("/overview")
    public ApiResponse<List<ProjectProgressResponse>> getAllProjectsProgress() {
        log.info("Generating progress overview for all projects");

        List<ProjectProgressResponse> allProgress = projectProgressTrackingService.getAllProjectsProgress();

        return ApiResponse.<List<ProjectProgressResponse>>builder()
                .result(allProgress)
                .message("All projects progress overview generated successfully")
                .build();
    }

    /**
     * Get project progress summary (lightweight version)
     */
    @GetMapping("/summary/{projectId}")
    public ApiResponse<ProjectSummary> getProjectSummary(@PathVariable String projectId) {
        log.info("Generating project summary for project: {}", projectId);

        ProjectProgressResponse fullProgress = projectProgressTrackingService.getProjectProgress(projectId);
        ProjectSummary summary = createProjectSummary(fullProgress);

        return ApiResponse.<ProjectSummary>builder()
                .result(summary)
                .message("Project summary generated successfully")
                .build();
    }

    /**
     * Get timeline and dependency information for a project
     */
    @GetMapping("/{projectId}/timeline")
    public ApiResponse<TimelineResponse> getProjectTimeline(@PathVariable String projectId) {
        log.info("Generating timeline information for project: {}", projectId);

        ProjectProgressResponse progress = projectProgressTrackingService.getProjectProgress(projectId);
        TimelineResponse timeline = createTimelineResponse(progress);

        return ApiResponse.<TimelineResponse>builder()
                .result(timeline)
                .message("Project timeline information generated successfully")
                .build();
    }

    /**
     * Get project dependencies and blocking relationships
     */
    @GetMapping("/{projectId}/dependencies")
    public ApiResponse<DependencyResponse> getProjectDependencies(@PathVariable String projectId) {
        log.info("Generating dependency information for project: {}", projectId);

        ProjectProgressResponse progress = projectProgressTrackingService.getProjectProgress(projectId);
        DependencyResponse dependencies = createDependencyResponse(progress);

        return ApiResponse.<DependencyResponse>builder()
                .result(dependencies)
                .message("Project dependencies information generated successfully")
                .build();
    }

    /**
     * Get dashboard data for project managers
     */
    @GetMapping("/dashboard")
    public ApiResponse<ProjectDashboard> getProjectsDashboard() {
        log.info("Generating projects dashboard");

        List<ProjectProgressResponse> allProjects = projectProgressTrackingService.getAllProjectsProgress();
        ProjectDashboard dashboard = createProjectDashboard(allProjects);

        return ApiResponse.<ProjectDashboard>builder()
                .result(dashboard)
                .message("Projects dashboard generated successfully")
                .build();
    }

    /**
     * Get user's project participation history
     */
    @GetMapping("/participation/{userId}")
    public ApiResponse<UserProjectHistory> getUserProjectHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "12") int monthsBack) {

        log.info("Generating project participation history for user: {}", userId);

        // In real implementation, query user's project history from database
        UserProjectHistory history = generateUserProjectHistory(userId, monthsBack);

        return ApiResponse.<UserProjectHistory>builder()
                .result(history)
                .message("User project participation history generated successfully")
                .build();
    }

    // Helper methods to create response objects
    private ProjectSummary createProjectSummary(ProjectProgressResponse progress) {
        return ProjectSummary.builder()
                .projectId(progress.getProjectId())
                .projectName(progress.getProjectName())
                .status(progress.getStatus())
                .overallProgress(progress.getOverallProgressPercentage())
                .isOnSchedule(progress.getIsOnSchedule())
                .teamSize(progress.getTotalTeamMembers())
                .budgetUtilization(progress.getBudgetUtilizationPercentage())
                .riskLevel(progress.getRiskLevel())
                .build();
    }

    private TimelineResponse createTimelineResponse(ProjectProgressResponse progress) {
        return TimelineResponse.builder()
                .projectId(progress.getProjectId())
                .plannedStartDate(progress.getPlannedStartDate())
                .actualStartDate(progress.getActualStartDate())
                .plannedEndDate(progress.getPlannedEndDate())
                .estimatedCompletionDate(progress.getEstimatedCompletionDate())
                .delayDays(progress.getDelayDays())
                .milestones(progress.getMilestones())
                .criticalPath(generateCriticalPath(progress))
                .build();
    }

    private DependencyResponse createDependencyResponse(ProjectProgressResponse progress) {
        return DependencyResponse.builder()
                .projectId(progress.getProjectId())
                .dependencies(progress.getDependencies())
                .blockingProjects(progress.getBlockingProjects())
                .dependentProjects(progress.getDependentProjects())
                .dependencyImpact(calculateDependencyImpact(progress))
                .build();
    }

    private ProjectDashboard createProjectDashboard(List<ProjectProgressResponse> allProjects) {
        return ProjectDashboard.builder()
                .totalProjects(allProjects.size())
                .activeProjects((int) allProjects.stream().filter(p -> "IN_PROGRESS".equals(p.getStatus())).count())
                .completedProjects((int) allProjects.stream().filter(p -> "COMPLETED".equals(p.getStatus())).count())
                .delayedProjects((int) allProjects.stream().filter(p -> !p.getIsOnSchedule()).count())
                .averageProgress(allProjects.stream().mapToDouble(ProjectProgressResponse::getOverallProgressPercentage).average().orElse(0.0))
                .totalBudget(allProjects.stream().mapToDouble(ProjectProgressResponse::getTotalBudget).sum())
                .spentBudget(allProjects.stream().mapToDouble(ProjectProgressResponse::getSpentBudget).sum())
                .highRiskProjects((int) allProjects.stream().filter(p -> "HIGH".equals(p.getRiskLevel()) || "CRITICAL".equals(p.getRiskLevel())).count())
                .projectSummaries(allProjects.stream().map(this::createProjectSummary).collect(java.util.stream.Collectors.toList()))
                .build();
    }

    private UserProjectHistory generateUserProjectHistory(String userId, int monthsBack) {
        // In real implementation, query from database
        return UserProjectHistory.builder()
                .userId(userId)
                .totalProjectsParticipated(8)
                .activeProjects(2)
                .completedProjects(6)
                .averageProjectDuration(4.5) // months
                .totalContributionHours(1200.0)
                .averagePerformanceScore(4.2)
                .projectRoles(java.util.List.of("Developer", "Tech Lead", "Senior Developer"))
                .recentProjects(generateRecentProjectParticipations(userId))
                .build();
    }

    private java.util.List<String> generateCriticalPath(ProjectProgressResponse progress) {
        // Simplified critical path calculation
        return java.util.List.of("Requirements", "Design", "Development", "Testing", "Deployment");
    }

    private String calculateDependencyImpact(ProjectProgressResponse progress) {
        if (progress.getBlockingProjects().size() > 2) return "HIGH";
        if (progress.getBlockingProjects().size() > 0) return "MEDIUM";
        return "LOW";
    }

    private java.util.List<ProjectParticipation> generateRecentProjectParticipations(String userId) {
        // Sample data - in real implementation, query from database
        return java.util.List.of(
            ProjectParticipation.builder()
                .projectId("PROJ-001")
                .projectName("E-commerce Platform")
                .role("Senior Developer")
                .startDate(java.time.LocalDate.now().minusMonths(6))
                .endDate(java.time.LocalDate.now().minusMonths(2))
                .status("COMPLETED")
                .contributionHours(320.0)
                .performanceRating(4.5)
                .build(),
            ProjectParticipation.builder()
                .projectId("PROJ-002")
                .projectName("Mobile App Development")
                .role("Tech Lead")
                .startDate(java.time.LocalDate.now().minusMonths(3))
                .endDate(null)
                .status("IN_PROGRESS")
                .contributionHours(180.0)
                .performanceRating(4.2)
                .build()
        );
    }

    // Inner classes for response objects
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProjectSummary {
        private String projectId;
        private String projectName;
        private String status;
        private Double overallProgress;
        private Boolean isOnSchedule;
        private Integer teamSize;
        private Double budgetUtilization;
        private String riskLevel;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TimelineResponse {
        private String projectId;
        private java.time.LocalDate plannedStartDate;
        private java.time.LocalDate actualStartDate;
        private java.time.LocalDate plannedEndDate;
        private java.time.LocalDate estimatedCompletionDate;
        private Integer delayDays;
        private java.util.List<ProjectProgressResponse.MilestoneProgress> milestones;
        private java.util.List<String> criticalPath;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class DependencyResponse {
        private String projectId;
        private java.util.List<ProjectProgressResponse.ProjectDependency> dependencies;
        private java.util.List<String> blockingProjects;
        private java.util.List<String> dependentProjects;
        private String dependencyImpact;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProjectDashboard {
        private Integer totalProjects;
        private Integer activeProjects;
        private Integer completedProjects;
        private Integer delayedProjects;
        private Double averageProgress;
        private Double totalBudget;
        private Double spentBudget;
        private Integer highRiskProjects;
        private java.util.List<ProjectSummary> projectSummaries;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class UserProjectHistory {
        private String userId;
        private Integer totalProjectsParticipated;
        private Integer activeProjects;
        private Integer completedProjects;
        private Double averageProjectDuration;
        private Double totalContributionHours;
        private Double averagePerformanceScore;
        private java.util.List<String> projectRoles;
        private java.util.List<ProjectParticipation> recentProjects;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ProjectParticipation {
        private String projectId;
        private String projectName;
        private String role;
        private java.time.LocalDate startDate;
        private java.time.LocalDate endDate;
        private String status;
        private Double contributionHours;
        private Double performanceRating;
    }

    // Simple ApiResponse class for this controller
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ApiResponse<T> {
        private T result;
        private String message;
        private Integer code;
    }
}
