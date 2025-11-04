package com.mnp.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PerformanceReportResponse {
    String userId;
    String employeeId;
    String fullName;
    String department;
    String position;

    // Overall Performance Metrics
    Double overallPerformanceScore;
    String performanceGrade; // A, B, C, D
    Integer totalTasksCompleted;
    Integer totalTasksAssigned;
    Double taskCompletionRate;

    // Time-based Performance
    Double averageTaskCompletionTime; // in hours
    Double onTimeDeliveryRate;
    Integer overdueTasks;

    // Quality Metrics
    Double averageTaskRating;
    Integer tasksWithHighRating; // rating >= 4
    Integer tasksRequiringRework;

    // Productivity Metrics
    Double tasksCompletedPerWeek;
    Double hoursWorkedThisMonth;
    Double productivityScore;

    // Project Participation
    Integer activeProjects;
    Integer completedProjects;
    List<ProjectParticipationSummary> projectHistory;

    // Skill Development
    Map<String, Double> skillRatings;
    List<String> recommendedSkillImprovements;

    // Trend Analysis
    List<MonthlyPerformanceData> monthlyTrends;
    String performanceTrend; // IMPROVING, STABLE, DECLINING

    // Comparison with Peers
    Double departmentAverageScore;
    String rankInDepartment; // TOP_10, ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE

    LocalDateTime reportGeneratedAt;
    String reportPeriod; // MONTHLY, QUARTERLY, YEARLY

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectParticipationSummary {
        String projectId;
        String projectName;
        String role;
        LocalDateTime startDate;
        LocalDateTime endDate;
        String status;
        Double contributionScore;
        Integer tasksCompleted;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyPerformanceData {
        String month;
        Integer year;
        Double performanceScore;
        Integer tasksCompleted;
        Double hoursWorked;
    }
}
