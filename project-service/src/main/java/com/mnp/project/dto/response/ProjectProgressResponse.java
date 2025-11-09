package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectProgressResponse {
    String projectId;
    String projectName;
    String description;
    String status; // PLANNING, IN_PROGRESS, ON_HOLD, COMPLETED, CANCELLED
    Double completionPercentage;
    // Progress Metrics
    Double overallProgressPercentage;
    Integer totalTasks;
    Integer completedTasks;
    Integer inProgressTasks;
    Integer pendingTasks;
    Integer overdueTasks;

    // Timeline Information
    LocalDate plannedStartDate;
    LocalDate actualStartDate;
    LocalDate plannedEndDate;
    LocalDate estimatedCompletionDate;
    LocalDate actualEndDate;
    Integer delayDays;
    Boolean isOnSchedule;
    Integer daysRemaining;

    // Resource Allocation
    Integer totalTeamMembers;
    Integer activeTeamMembers;
    Double totalBudget;
    Double spentBudget;
    Double budgetUtilizationPercentage;

    // Quality Metrics
    Double averageTaskQuality;
    Integer tasksWithIssues;
    Integer criticalIssues;
    Double clientSatisfactionScore;

    // Team Performance
    List<TeamMemberProgress> teamProgress;
    Map<String, Double> departmentContribution; // department -> hours contributed

    // Milestone Tracking
    List<MilestoneProgress> milestones;
    Integer completedMilestones;
    Integer totalMilestones;

    // Risk Analysis
    List<ProjectRisk> identifiedRisks;
    String riskLevel; // LOW, MEDIUM, HIGH, CRITICAL

    // Dependencies
    List<ProjectDependency> dependencies;
    List<String> blockingProjects;
    List<String> dependentProjects;

    // Recent Activity
    List<ProjectActivity> recentActivities;

    LocalDateTime lastUpdated;
    String reportGeneratedBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TeamMemberProgress {
        String userId;
        String fullName;
        String role;
        Integer assignedTasks;
        Integer completedTasks;
        Double progressPercentage;
        Double hoursContributed;
        Double performanceScore;
        String status; // ACTIVE, INACTIVE, OVERLOADED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MilestoneProgress {
        String milestoneId;
        String title;
        String description;
        LocalDate plannedDate;
        LocalDate actualDate;
        String status; // COMPLETED, IN_PROGRESS, DELAYED, PENDING
        Double progressPercentage;
        List<String> dependencies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectRisk {
        String riskId;
        String description;
        String category; // TECHNICAL, RESOURCE, TIMELINE, BUDGET
        String severity; // LOW, MEDIUM, HIGH, CRITICAL
        String probability; // LOW, MEDIUM, HIGH
        String mitigation;
        String owner;
        LocalDate identifiedDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectDependency {
        String dependencyId;
        String dependentProjectId;
        String dependentProjectName;
        String dependencyType; // START_TO_START, FINISH_TO_START, START_TO_FINISH, FINISH_TO_FINISH
        String status; // WAITING, READY, BLOCKED, RESOLVED
        LocalDate expectedResolutionDate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectActivity {
        String activityId;
        String description;
        String activityType; // TASK_COMPLETED, MILESTONE_REACHED, ISSUE_RESOLVED, MEMBER_ADDED
        String performedBy;
        LocalDateTime timestamp;
        Map<String, Object> metadata;
    }
}
