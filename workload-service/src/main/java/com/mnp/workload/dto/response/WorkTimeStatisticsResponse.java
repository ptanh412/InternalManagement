package com.mnp.workload.dto.response;

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
public class WorkTimeStatisticsResponse {
    String userId;
    String employeeId;
    String fullName;

    // Current Period Statistics
    Double totalHoursThisWeek;
    Double totalHoursThisMonth;
    Double totalHoursThisYear;

    // Average Statistics
    Double averageHoursPerDay;
    Double averageHoursPerWeek;
    Double averageHoursPerMonth;

    // Productivity Metrics
    Double productiveHoursPercentage;
    Double overtimeHours;
    Double regularHours;

    // Time Distribution
    Map<String, Double> timeByProject; // projectId -> hours
    Map<String, Double> timeByTaskType; // taskType -> hours
    Map<String, Double> timeByDay; // dayOfWeek -> hours

    // Detailed Daily Records
    List<DailyWorkRecord> dailyRecords;

    // Trends and Patterns
    List<WeeklyWorkSummary> weeklyTrends;
    String workPatternAnalysis; // CONSISTENT, IRREGULAR, IMPROVING, DECLINING

    // Comparison Metrics
    Double departmentAverageHours;
    String workloadComparisonToPeers; // ABOVE_AVERAGE, AVERAGE, BELOW_AVERAGE

    // Break and Rest Analysis
    Double averageBreakTimePerDay;
    Integer continuousWorkingDays;
    LocalDate lastRestDay;

    LocalDateTime reportGeneratedAt;
    String reportPeriod;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyWorkRecord {
        LocalDate date;
        LocalDateTime startTime;
        LocalDateTime endTime;
        Double totalHours;
        Double productiveHours;
        Double breakHours;
        Integer tasksCompleted;
        String primaryProject;
        String workQuality; // EXCELLENT, GOOD, AVERAGE, POOR
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyWorkSummary {
        String weekOf; // ISO week format
        Integer year;
        Double totalHours;
        Double averageDailyHours;
        Integer workingDays;
        Double productivity;
    }
}
