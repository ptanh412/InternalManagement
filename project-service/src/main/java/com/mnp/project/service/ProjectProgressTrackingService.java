package com.mnp.project.service;

import com.mnp.project.dto.response.ProjectProgressResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ProjectProgressTrackingService {

    RestTemplate restTemplate;

    private static final String TASK_SERVICE_URL = "http://localhost:8888/api/v1/tasks";
    private static final String IDENTITY_SERVICE_URL = "http://localhost:8888/api/v1/identity/users";

    public ProjectProgressResponse getProjectProgress(String projectId) {
        log.info("Generating project progress report for project: {}", projectId);

        try {
            // Fetch project basic info
            ProjectInfo projectInfo = fetchProjectInfo(projectId);

            // Fetch project tasks
            List<TaskInfo> tasks = fetchProjectTasks(projectId);

            // Fetch team members
            List<TeamMemberInfo> teamMembers = fetchProjectTeamMembers(projectId);

            // Calculate progress metrics
            ProgressMetrics metrics = calculateProgressMetrics(tasks, projectInfo);

            // Generate team progress
            List<ProjectProgressResponse.TeamMemberProgress> teamProgress =
                generateTeamProgress(teamMembers, tasks);

            // Generate milestone progress
            List<ProjectProgressResponse.MilestoneProgress> milestones =
                generateMilestoneProgress(projectId, tasks);

            // Identify risks
            List<ProjectProgressResponse.ProjectRisk> risks =
                identifyProjectRisks(projectInfo, metrics, tasks);

            // Fetch dependencies
            List<ProjectProgressResponse.ProjectDependency> dependencies =
                fetchProjectDependencies(projectId);

            // Generate recent activities
            List<ProjectProgressResponse.ProjectActivity> recentActivities =
                generateRecentActivities(projectId, tasks);

            return ProjectProgressResponse.builder()
                .projectId(projectId)
                .projectName(projectInfo.name)
                .description(projectInfo.description)
                .status(projectInfo.status)
                .overallProgressPercentage(metrics.overallProgress)
                .totalTasks(metrics.totalTasks)
                .completedTasks(metrics.completedTasks)
                .inProgressTasks(metrics.inProgressTasks)
                .pendingTasks(metrics.pendingTasks)
                .overdueTasks(metrics.overdueTasks)
                .plannedStartDate(projectInfo.plannedStartDate)
                .actualStartDate(projectInfo.actualStartDate)
                .plannedEndDate(projectInfo.plannedEndDate)
                .estimatedCompletionDate(calculateEstimatedCompletion(metrics, projectInfo))
                .actualEndDate(projectInfo.actualEndDate)
                .delayDays(calculateDelayDays(projectInfo))
                .isOnSchedule(isProjectOnSchedule(metrics, projectInfo))
                .totalTeamMembers(teamMembers.size())
                .activeTeamMembers((int) teamMembers.stream().filter(tm -> tm.isActive).count())
                .totalBudget(projectInfo.totalBudget)
                .spentBudget(projectInfo.spentBudget)
                .budgetUtilizationPercentage(calculateBudgetUtilization(projectInfo))
                .averageTaskQuality(calculateAverageTaskQuality(tasks))
                .tasksWithIssues(metrics.tasksWithIssues)
                .criticalIssues(metrics.criticalIssues)
                .clientSatisfactionScore(projectInfo.clientSatisfactionScore)
                .teamProgress(teamProgress)
                .departmentContribution(calculateDepartmentContribution(teamMembers))
                .milestones(milestones)
                .completedMilestones((int) milestones.stream().filter(m -> "COMPLETED".equals(m.getStatus())).count())
                .totalMilestones(milestones.size())
                .identifiedRisks(risks)
                .riskLevel(calculateOverallRiskLevel(risks))
                .dependencies(dependencies)
                .blockingProjects(findBlockingProjects(dependencies))
                .dependentProjects(findDependentProjects(dependencies))
                .recentActivities(recentActivities)
                .lastUpdated(LocalDateTime.now())
                .reportGeneratedBy("System")
                .build();

        } catch (Exception e) {
            log.error("Failed to generate project progress for project: {}", projectId, e);
            throw new RuntimeException("Failed to generate project progress: " + e.getMessage());
        }
    }

    public List<ProjectProgressResponse> getAllProjectsProgress() {
        log.info("Generating progress reports for all projects");

        try {
            // Fetch all project IDs (in real implementation, get from database)
            List<String> projectIds = fetchAllProjectIds();

            return projectIds.stream()
                .map(this::getProjectProgress)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to generate progress for all projects", e);
            throw new RuntimeException("Failed to generate all projects progress: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private ProjectInfo fetchProjectInfo(String projectId) {
        try {
            // In real implementation, fetch from project repository
            return ProjectInfo.builder()
                .id(projectId)
                .name("Sample Project " + projectId)
                .description("Project description for " + projectId)
                .status("IN_PROGRESS")
                .plannedStartDate(LocalDate.now().minusMonths(2))
                .actualStartDate(LocalDate.now().minusMonths(2).plusDays(3))
                .plannedEndDate(LocalDate.now().plusMonths(1))
                .actualEndDate(null)
                .totalBudget(100000.0)
                .spentBudget(65000.0)
                .clientSatisfactionScore(4.2)
                .build();
        } catch (Exception e) {
            log.warn("Failed to fetch project info for: {}", projectId);
            throw new RuntimeException("Project not found: " + projectId);
        }
    }

    @SuppressWarnings("unchecked")
    private List<TaskInfo> fetchProjectTasks(String projectId) {
        try {
            String url = TASK_SERVICE_URL + "/project/" + projectId;
            List<Map<String, Object>> tasksData = restTemplate.getForObject(url, List.class);

            return tasksData.stream().map(data -> TaskInfo.builder()
                .id((String) data.get("id"))
                .title((String) data.get("title"))
                .status((String) data.get("status"))
                .priority((String) data.get("priority"))
                .assigneeId((String) data.get("assigneeId"))
                .estimatedHours(((Number) data.getOrDefault("estimatedHours", 0.0)).doubleValue())
                .actualHours(((Number) data.getOrDefault("actualHours", 0.0)).doubleValue())
                .qualityRating(((Number) data.getOrDefault("qualityRating", 3.0)).doubleValue())
                .hasIssues((Boolean) data.getOrDefault("hasIssues", false))
                .isCritical((Boolean) data.getOrDefault("isCritical", false))
                .dueDate(data.get("dueDate") != null ?
                    LocalDate.parse((String) data.get("dueDate")) : null)
                .completedDate(data.get("completedDate") != null ?
                    LocalDate.parse((String) data.get("completedDate")) : null)
                .build()).collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to fetch tasks for project: {}, generating sample data", projectId);
            return generateSampleTasks(projectId);
        }
    }

    private List<TeamMemberInfo> fetchProjectTeamMembers(String projectId) {
        try {
            // In real implementation, fetch from project-team mapping
            return generateSampleTeamMembers(projectId);
        } catch (Exception e) {
            log.warn("Failed to fetch team members for project: {}", projectId);
            return new ArrayList<>();
        }
    }

    private ProgressMetrics calculateProgressMetrics(List<TaskInfo> tasks, ProjectInfo projectInfo) {
        ProgressMetrics metrics = new ProgressMetrics();

        metrics.totalTasks = tasks.size();
        metrics.completedTasks = (int) tasks.stream().filter(t -> "COMPLETED".equals(t.status)).count();
        metrics.inProgressTasks = (int) tasks.stream().filter(t -> "IN_PROGRESS".equals(t.status)).count();
        metrics.pendingTasks = (int) tasks.stream().filter(t -> "PENDING".equals(t.status)).count();

        // Calculate overdue tasks
        LocalDate today = LocalDate.now();
        metrics.overdueTasks = (int) tasks.stream()
            .filter(t -> t.dueDate != null && t.dueDate.isBefore(today) && !"COMPLETED".equals(t.status))
            .count();

        // Calculate overall progress
        if (metrics.totalTasks > 0) {
            metrics.overallProgress = (double) metrics.completedTasks / metrics.totalTasks * 100;
        }

        // Calculate quality metrics
        metrics.tasksWithIssues = (int) tasks.stream().filter(TaskInfo::isHasIssues).count();
        metrics.criticalIssues = (int) tasks.stream().filter(TaskInfo::isCritical).count();

        return metrics;
    }

    private List<ProjectProgressResponse.TeamMemberProgress> generateTeamProgress(
            List<TeamMemberInfo> teamMembers, List<TaskInfo> tasks) {

        return teamMembers.stream().map(member -> {
            List<TaskInfo> memberTasks = tasks.stream()
                .filter(t -> member.userId.equals(t.assigneeId))
                .collect(Collectors.toList());

            int assignedTasks = memberTasks.size();
            int completedTasks = (int) memberTasks.stream()
                .filter(t -> "COMPLETED".equals(t.status))
                .count();

            double hoursContributed = memberTasks.stream()
                .mapToDouble(TaskInfo::getActualHours)
                .sum();

            double progressPercentage = assignedTasks > 0 ?
                (double) completedTasks / assignedTasks * 100 : 0;

            return ProjectProgressResponse.TeamMemberProgress.builder()
                .userId(member.userId)
                .fullName(member.fullName)
                .role(member.role)
                .assignedTasks(assignedTasks)
                .completedTasks(completedTasks)
                .progressPercentage(progressPercentage)
                .hoursContributed(hoursContributed)
                .performanceScore(calculateMemberPerformanceScore(memberTasks))
                .status(member.isActive ? "ACTIVE" : "INACTIVE")
                .build();
        }).collect(Collectors.toList());
    }

    private List<ProjectProgressResponse.MilestoneProgress> generateMilestoneProgress(
            String projectId, List<TaskInfo> tasks) {

        // Sample milestone data (in real implementation, fetch from database)
        List<ProjectProgressResponse.MilestoneProgress> milestones = new ArrayList<>();

        milestones.add(ProjectProgressResponse.MilestoneProgress.builder()
            .milestoneId("MS-1")
            .title("Requirements Analysis Complete")
            .description("All requirements gathered and documented")
            .plannedDate(LocalDate.now().minusMonths(1))
            .actualDate(LocalDate.now().minusMonths(1).plusDays(2))
            .status("COMPLETED")
            .progressPercentage(100.0)
            .dependencies(Arrays.asList("REQ-1", "REQ-2"))
            .build());

        milestones.add(ProjectProgressResponse.MilestoneProgress.builder()
            .milestoneId("MS-2")
            .title("MVP Development Complete")
            .description("Minimum viable product ready for testing")
            .plannedDate(LocalDate.now())
            .actualDate(null)
            .status("IN_PROGRESS")
            .progressPercentage(75.0)
            .dependencies(Arrays.asList("DEV-1", "DEV-2", "DEV-3"))
            .build());

        return milestones;
    }

    private List<ProjectProgressResponse.ProjectRisk> identifyProjectRisks(
            ProjectInfo projectInfo, ProgressMetrics metrics, List<TaskInfo> tasks) {

        List<ProjectProgressResponse.ProjectRisk> risks = new ArrayList<>();

        // Budget risk
        double budgetUtilization = calculateBudgetUtilization(projectInfo);
        if (budgetUtilization > 80) {
            risks.add(ProjectProgressResponse.ProjectRisk.builder()
                .riskId("RISK-BUDGET-1")
                .description("Budget utilization exceeds 80%")
                .category("BUDGET")
                .severity("HIGH")
                .probability("HIGH")
                .mitigation("Review spending and optimize resource allocation")
                .owner("Project Manager")
                .identifiedDate(LocalDate.now())
                .build());
        }

        // Timeline risk
        if (metrics.overdueTasks > 0) {
            risks.add(ProjectProgressResponse.ProjectRisk.builder()
                .riskId("RISK-TIMELINE-1")
                .description("Multiple tasks are overdue")
                .category("TIMELINE")
                .severity(metrics.overdueTasks > 5 ? "CRITICAL" : "MEDIUM")
                .probability("HIGH")
                .mitigation("Reassign resources and extend timeline if necessary")
                .owner("Team Lead")
                .identifiedDate(LocalDate.now())
                .build());
        }

        return risks;
    }

    private List<ProjectProgressResponse.ProjectDependency> fetchProjectDependencies(String projectId) {
        // Sample dependencies (in real implementation, fetch from database)
        List<ProjectProgressResponse.ProjectDependency> dependencies = new ArrayList<>();

        dependencies.add(ProjectProgressResponse.ProjectDependency.builder()
            .dependencyId("DEP-1")
            .dependentProjectId("PROJ-002")
            .dependentProjectName("Infrastructure Setup")
            .dependencyType("FINISH_TO_START")
            .status("READY")
            .expectedResolutionDate(LocalDate.now().plusDays(5))
            .build());

        return dependencies;
    }

    private List<ProjectProgressResponse.ProjectActivity> generateRecentActivities(
            String projectId, List<TaskInfo> tasks) {

        List<ProjectProgressResponse.ProjectActivity> activities = new ArrayList<>();

        // Generate sample activities based on completed tasks
        tasks.stream()
            .filter(t -> "COMPLETED".equals(t.status) && t.completedDate != null)
            .filter(t -> t.completedDate.isAfter(LocalDate.now().minusDays(7)))
            .forEach(task -> {
                Map<String, Object> metadata = new HashMap<>();
                metadata.put("taskId", task.id);
                metadata.put("estimatedHours", task.estimatedHours);
                metadata.put("actualHours", task.actualHours);

                activities.add(ProjectProgressResponse.ProjectActivity.builder()
                    .activityId(UUID.randomUUID().toString())
                    .description("Task completed: " + task.title)
                    .activityType("TASK_COMPLETED")
                    .performedBy(task.assigneeId)
                    .timestamp(task.completedDate.atTime(17, 0))
                    .metadata(metadata)
                    .build());
            });

        return activities.stream()
            .sorted(Comparator.comparing(ProjectProgressResponse.ProjectActivity::getTimestamp).reversed())
            .limit(10)
            .collect(Collectors.toList());
    }

    // Helper methods
    private LocalDate calculateEstimatedCompletion(ProgressMetrics metrics, ProjectInfo projectInfo) {
        if (metrics.overallProgress == 0) return projectInfo.plannedEndDate;

        long daysSinceStart = ChronoUnit.DAYS.between(
            projectInfo.actualStartDate != null ? projectInfo.actualStartDate : projectInfo.plannedStartDate,
            LocalDate.now()
        );

        double remainingProgress = 100 - metrics.overallProgress;
        long estimatedRemainingDays = (long) (daysSinceStart * remainingProgress / metrics.overallProgress);

        return LocalDate.now().plusDays(estimatedRemainingDays);
    }

    private Integer calculateDelayDays(ProjectInfo projectInfo) {
        if (projectInfo.actualEndDate != null) {
            return (int) ChronoUnit.DAYS.between(projectInfo.plannedEndDate, projectInfo.actualEndDate);
        }

        if (LocalDate.now().isAfter(projectInfo.plannedEndDate)) {
            return (int) ChronoUnit.DAYS.between(projectInfo.plannedEndDate, LocalDate.now());
        }

        return 0;
    }

    private Boolean isProjectOnSchedule(ProgressMetrics metrics, ProjectInfo projectInfo) {
        LocalDate estimatedCompletion = calculateEstimatedCompletion(metrics, projectInfo);
        return !estimatedCompletion.isAfter(projectInfo.plannedEndDate);
    }

    private Double calculateBudgetUtilization(ProjectInfo projectInfo) {
        return projectInfo.totalBudget > 0 ?
            (projectInfo.spentBudget / projectInfo.totalBudget) * 100 : 0;
    }

    private Double calculateAverageTaskQuality(List<TaskInfo> tasks) {
        return tasks.stream()
            .filter(t -> "COMPLETED".equals(t.status))
            .mapToDouble(TaskInfo::getQualityRating)
            .average()
            .orElse(3.0);
    }

    private Map<String, Double> calculateDepartmentContribution(List<TeamMemberInfo> teamMembers) {
        return teamMembers.stream()
            .collect(Collectors.groupingBy(
                TeamMemberInfo::getDepartment,
                Collectors.summingDouble(TeamMemberInfo::getHoursContributed)
            ));
    }

    private String calculateOverallRiskLevel(List<ProjectProgressResponse.ProjectRisk> risks) {
        if (risks.stream().anyMatch(r -> "CRITICAL".equals(r.getSeverity()))) return "CRITICAL";
        if (risks.stream().anyMatch(r -> "HIGH".equals(r.getSeverity()))) return "HIGH";
        if (risks.stream().anyMatch(r -> "MEDIUM".equals(r.getSeverity()))) return "MEDIUM";
        return "LOW";
    }

    private List<String> findBlockingProjects(List<ProjectProgressResponse.ProjectDependency> dependencies) {
        return dependencies.stream()
            .filter(d -> "BLOCKED".equals(d.getStatus()))
            .map(ProjectProgressResponse.ProjectDependency::getDependentProjectId)
            .collect(Collectors.toList());
    }

    private List<String> findDependentProjects(List<ProjectProgressResponse.ProjectDependency> dependencies) {
        return dependencies.stream()
            .map(ProjectProgressResponse.ProjectDependency::getDependentProjectId)
            .distinct()
            .collect(Collectors.toList());
    }

    private double calculateMemberPerformanceScore(List<TaskInfo> memberTasks) {
        if (memberTasks.isEmpty()) return 0.0;

        double completionRate = memberTasks.stream()
            .filter(t -> "COMPLETED".equals(t.status))
            .count() / (double) memberTasks.size() * 100;

        double qualityScore = memberTasks.stream()
            .filter(t -> "COMPLETED".equals(t.status))
            .mapToDouble(TaskInfo::getQualityRating)
            .average()
            .orElse(3.0) / 5.0 * 100;

        return (completionRate + qualityScore) / 2;
    }

    private List<String> fetchAllProjectIds() {
        // In real implementation, fetch from database
        return Arrays.asList("PROJ-001", "PROJ-002", "PROJ-003", "PROJ-004");
    }

    private List<TaskInfo> generateSampleTasks(String projectId) {
        List<TaskInfo> tasks = new ArrayList<>();

        for (int i = 1; i <= 20; i++) {
            String status = i <= 12 ? "COMPLETED" : (i <= 17 ? "IN_PROGRESS" : "PENDING");

            tasks.add(TaskInfo.builder()
                .id("TASK-" + projectId + "-" + i)
                .title("Task " + i + " for " + projectId)
                .status(status)
                .priority(i % 3 == 0 ? "HIGH" : "MEDIUM")
                .assigneeId("USER-" + (i % 5 + 1))
                .estimatedHours(8.0 + (i % 16))
                .actualHours(status.equals("COMPLETED") ? 8.0 + (i % 12) : 0.0)
                .qualityRating(3.0 + (Math.random() * 2))
                .hasIssues(Math.random() < 0.1)
                .isCritical(Math.random() < 0.05)
                .dueDate(LocalDate.now().plusDays(i - 10))
                .completedDate(status.equals("COMPLETED") ? LocalDate.now().minusDays(20 - i) : null)
                .build());
        }

        return tasks;
    }

    private List<TeamMemberInfo> generateSampleTeamMembers(String projectId) {
        List<TeamMemberInfo> members = new ArrayList<>();

        members.add(TeamMemberInfo.builder()
            .userId("USER-1")
            .fullName("John Doe")
            .role("Backend Developer")
            .department("Development")
            .isActive(true)
            .hoursContributed(120.0)
            .build());

        members.add(TeamMemberInfo.builder()
            .userId("USER-2")
            .fullName("Jane Smith")
            .role("Frontend Developer")
            .department("Development")
            .isActive(true)
            .hoursContributed(110.0)
            .build());

        return members;
    }

    // Inner classes for data structures
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class ProjectInfo {
        String id;
        String name;
        String description;
        String status;
        LocalDate plannedStartDate;
        LocalDate actualStartDate;
        LocalDate plannedEndDate;
        LocalDate actualEndDate;
        Double totalBudget;
        Double spentBudget;
        Double clientSatisfactionScore;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class TaskInfo {
        String id;
        String title;
        String status;
        String priority;
        String assigneeId;
        Double estimatedHours;
        Double actualHours;
        Double qualityRating;
        boolean hasIssues;
        boolean isCritical;
        LocalDate dueDate;
        LocalDate completedDate;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class TeamMemberInfo {
        String userId;
        String fullName;
        String role;
        String department;
        boolean isActive;
        Double hoursContributed;
    }

    private static class ProgressMetrics {
        double overallProgress;
        int totalTasks;
        int completedTasks;
        int inProgressTasks;
        int pendingTasks;
        int overdueTasks;
        int tasksWithIssues;
        int criticalIssues;
    }
}
