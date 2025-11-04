package com.mnp.workload.service;

import com.mnp.workload.dto.response.WorkTimeStatisticsResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WorkTimeStatisticsService {

    RestTemplate restTemplate;

    private static final String TASK_SERVICE_URL = "http://localhost:8888/api/v1/tasks";
    private static final String IDENTITY_SERVICE_URL = "http://localhost:8888/api/v1/identity/users";

    public WorkTimeStatisticsResponse generateWorkTimeStatistics(String userId, String period) {
        log.info("Generating work time statistics for user: {} with period: {}", userId, period);

        try {
            // Fetch user basic info
            Map<String, Object> userInfo = fetchUserInfo(userId);

            // Fetch time tracking data
            List<TimeRecord> timeRecords = fetchTimeTrackingData(userId, period);

            // Calculate statistics
            TimeStatistics stats = calculateTimeStatistics(timeRecords);

            // Generate daily records
            List<WorkTimeStatisticsResponse.DailyWorkRecord> dailyRecords =
                generateDailyRecords(timeRecords);

            // Generate weekly trends
            List<WorkTimeStatisticsResponse.WeeklyWorkSummary> weeklyTrends =
                generateWeeklyTrends(timeRecords);

            // Get department comparison
            double departmentAverage = getDepartmentAverageHours(userId);

            return WorkTimeStatisticsResponse.builder()
                .userId(userId)
                .employeeId((String) userInfo.getOrDefault("employeeId", "N/A"))
                .fullName((String) userInfo.getOrDefault("fullName", "Unknown"))
                .totalHoursThisWeek(stats.hoursThisWeek)
                .totalHoursThisMonth(stats.hoursThisMonth)
                .totalHoursThisYear(stats.hoursThisYear)
                .averageHoursPerDay(stats.avgHoursPerDay)
                .averageHoursPerWeek(stats.avgHoursPerWeek)
                .averageHoursPerMonth(stats.avgHoursPerMonth)
                .productiveHoursPercentage(stats.productiveHoursPercentage)
                .overtimeHours(stats.overtimeHours)
                .regularHours(stats.regularHours)
                .timeByProject(stats.timeByProject)
                .timeByTaskType(stats.timeByTaskType)
                .timeByDay(stats.timeByDay)
                .dailyRecords(dailyRecords)
                .weeklyTrends(weeklyTrends)
                .workPatternAnalysis(analyzeWorkPattern(weeklyTrends))
                .departmentAverageHours(departmentAverage)
                .workloadComparisonToPeers(compareTopeers(stats.avgHoursPerWeek, departmentAverage))
                .averageBreakTimePerDay(stats.avgBreakTimePerDay)
                .continuousWorkingDays(stats.continuousWorkingDays)
                .lastRestDay(stats.lastRestDay)
                .reportGeneratedAt(LocalDateTime.now())
                .reportPeriod(period)
                .build();

        } catch (Exception e) {
            log.error("Failed to generate work time statistics for user: {}", userId, e);
            throw new RuntimeException("Failed to generate work time statistics: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserInfo(String userId) {
        try {
            return restTemplate.getForObject(IDENTITY_SERVICE_URL + "/" + userId, Map.class);
        } catch (Exception e) {
            log.warn("Failed to fetch user info for: {}", userId);
            Map<String, Object> defaultInfo = new HashMap<>();
            defaultInfo.put("employeeId", "N/A");
            defaultInfo.put("fullName", "Unknown User");
            return defaultInfo;
        }
    }

    @SuppressWarnings("unchecked")
    private List<TimeRecord> fetchTimeTrackingData(String userId, String period) {
        try {
            String url = TASK_SERVICE_URL + "/time-tracking/" + userId + "?period=" + period;
            List<Map<String, Object>> rawData = restTemplate.getForObject(url, List.class);

            return rawData.stream().map(data -> TimeRecord.builder()
                .date(LocalDate.parse((String) data.get("date")))
                .startTime(data.get("startTime") != null ?
                    LocalDateTime.parse((String) data.get("startTime")) : null)
                .endTime(data.get("endTime") != null ?
                    LocalDateTime.parse((String) data.get("endTime")) : null)
                .totalHours(((Number) data.getOrDefault("totalHours", 0.0)).doubleValue())
                .productiveHours(((Number) data.getOrDefault("productiveHours", 0.0)).doubleValue())
                .breakHours(((Number) data.getOrDefault("breakHours", 0.0)).doubleValue())
                .projectId((String) data.get("projectId"))
                .taskType((String) data.get("taskType"))
                .tasksCompleted(((Number) data.getOrDefault("tasksCompleted", 0)).intValue())
                .build()).collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to fetch time tracking data for user: {}, generating sample data", userId);
            return generateSampleTimeData();
        }
    }

    private TimeStatistics calculateTimeStatistics(List<TimeRecord> timeRecords) {
        TimeStatistics stats = new TimeStatistics();

        LocalDate now = LocalDate.now();
        LocalDate weekStart = now.with(WeekFields.of(Locale.getDefault()).dayOfWeek(), 1);
        LocalDate monthStart = now.withDayOfMonth(1);
        LocalDate yearStart = now.withDayOfYear(1);

        // Calculate time periods
        stats.hoursThisWeek = timeRecords.stream()
            .filter(r -> !r.date.isBefore(weekStart))
            .mapToDouble(r -> r.totalHours)
            .sum();

        stats.hoursThisMonth = timeRecords.stream()
            .filter(r -> !r.date.isBefore(monthStart))
            .mapToDouble(r -> r.totalHours)
            .sum();

        stats.hoursThisYear = timeRecords.stream()
            .filter(r -> !r.date.isBefore(yearStart))
            .mapToDouble(r -> r.totalHours)
            .sum();

        // Calculate averages
        long totalDays = timeRecords.stream().map(r -> r.date).distinct().count();
        if (totalDays > 0) {
            stats.avgHoursPerDay = timeRecords.stream().mapToDouble(r -> r.totalHours).sum() / totalDays;
        }

        stats.avgHoursPerWeek = stats.hoursThisWeek;
        stats.avgHoursPerMonth = stats.hoursThisMonth;

        // Calculate productive hours percentage
        double totalHours = timeRecords.stream().mapToDouble(r -> r.totalHours).sum();
        double totalProductiveHours = timeRecords.stream().mapToDouble(r -> r.productiveHours).sum();
        stats.productiveHoursPercentage = totalHours > 0 ? (totalProductiveHours / totalHours) * 100 : 0;

        // Calculate overtime (assuming 8 hours/day is regular)
        stats.regularHours = timeRecords.stream()
            .mapToDouble(r -> Math.min(r.totalHours, 8.0))
            .sum();
        stats.overtimeHours = timeRecords.stream()
            .mapToDouble(r -> Math.max(r.totalHours - 8.0, 0.0))
            .sum();

        // Time distribution by project
        stats.timeByProject = timeRecords.stream()
            .filter(r -> r.projectId != null)
            .collect(Collectors.groupingBy(
                r -> r.projectId,
                Collectors.summingDouble(r -> r.totalHours)
            ));

        // Time distribution by task type
        stats.timeByTaskType = timeRecords.stream()
            .filter(r -> r.taskType != null)
            .collect(Collectors.groupingBy(
                r -> r.taskType,
                Collectors.summingDouble(r -> r.totalHours)
            ));

        // Time distribution by day of week
        stats.timeByDay = timeRecords.stream()
            .collect(Collectors.groupingBy(
                r -> r.date.getDayOfWeek().toString(),
                Collectors.summingDouble(r -> r.totalHours)
            ));

        // Break time analysis
        stats.avgBreakTimePerDay = timeRecords.stream()
            .mapToDouble(r -> r.breakHours)
            .average()
            .orElse(0.0);

        // Continuous working days
        stats.continuousWorkingDays = calculateContinuousWorkingDays(timeRecords);
        stats.lastRestDay = findLastRestDay(timeRecords);

        return stats;
    }

    private List<WorkTimeStatisticsResponse.DailyWorkRecord> generateDailyRecords(List<TimeRecord> timeRecords) {
        return timeRecords.stream()
            .collect(Collectors.groupingBy(TimeRecord::getDate))
            .entrySet().stream()
            .map(entry -> {
                LocalDate date = entry.getKey();
                List<TimeRecord> dayRecords = entry.getValue();

                return WorkTimeStatisticsResponse.DailyWorkRecord.builder()
                    .date(date)
                    .startTime(dayRecords.stream()
                        .map(TimeRecord::getStartTime)
                        .filter(Objects::nonNull)
                        .min(LocalDateTime::compareTo)
                        .orElse(null))
                    .endTime(dayRecords.stream()
                        .map(TimeRecord::getEndTime)
                        .filter(Objects::nonNull)
                        .max(LocalDateTime::compareTo)
                        .orElse(null))
                    .totalHours(dayRecords.stream().mapToDouble(TimeRecord::getTotalHours).sum())
                    .productiveHours(dayRecords.stream().mapToDouble(TimeRecord::getProductiveHours).sum())
                    .breakHours(dayRecords.stream().mapToDouble(TimeRecord::getBreakHours).sum())
                    .tasksCompleted(dayRecords.stream().mapToInt(TimeRecord::getTasksCompleted).sum())
                    .primaryProject(dayRecords.stream()
                        .collect(Collectors.groupingBy(TimeRecord::getProjectId, Collectors.summingDouble(TimeRecord::getTotalHours)))
                        .entrySet().stream()
                        .max(Map.Entry.comparingByValue())
                        .map(Map.Entry::getKey)
                        .orElse("N/A"))
                    .workQuality(calculateDailyWorkQuality(dayRecords))
                    .build();
            })
            .sorted(Comparator.comparing(WorkTimeStatisticsResponse.DailyWorkRecord::getDate).reversed())
            .collect(Collectors.toList());
    }

    private List<WorkTimeStatisticsResponse.WeeklyWorkSummary> generateWeeklyTrends(List<TimeRecord> timeRecords) {
        return timeRecords.stream()
            .collect(Collectors.groupingBy(record -> {
                WeekFields weekFields = WeekFields.of(Locale.getDefault());
                return record.date.get(weekFields.weekOfWeekBasedYear()) + "-" + record.date.getYear();
            }))
            .entrySet().stream()
            .map(entry -> {
                String weekKey = entry.getKey();
                List<TimeRecord> weekRecords = entry.getValue();

                String[] parts = weekKey.split("-");
                int week = Integer.parseInt(parts[0]);
                int year = Integer.parseInt(parts[1]);

                double totalHours = weekRecords.stream().mapToDouble(TimeRecord::getTotalHours).sum();
                long workingDays = weekRecords.stream().map(TimeRecord::getDate).distinct().count();

                return WorkTimeStatisticsResponse.WeeklyWorkSummary.builder()
                    .weekOf("Week " + week)
                    .year(year)
                    .totalHours(totalHours)
                    .averageDailyHours(workingDays > 0 ? totalHours / workingDays : 0)
                    .workingDays((int) workingDays)
                    .productivity(calculateWeeklyProductivity(weekRecords))
                    .build();
            })
            .sorted(Comparator.comparing((WorkTimeStatisticsResponse.WeeklyWorkSummary w) -> w.getYear())
                .thenComparing(w -> Integer.parseInt(w.getWeekOf().split(" ")[1])))
            .collect(Collectors.toList());
    }

    private String analyzeWorkPattern(List<WorkTimeStatisticsResponse.WeeklyWorkSummary> weeklyTrends) {
        if (weeklyTrends.size() < 3) return "INSUFFICIENT_DATA";

        List<Double> recentHours = weeklyTrends.stream()
            .skip(Math.max(0, weeklyTrends.size() - 4))
            .map(WorkTimeStatisticsResponse.WeeklyWorkSummary::getTotalHours)
            .collect(Collectors.toList());

        double variance = calculateVariance(recentHours);
        double trend = calculateTrend(recentHours);

        if (variance > 100) return "IRREGULAR";
        if (trend > 5) return "IMPROVING";
        if (trend < -5) return "DECLINING";
        return "CONSISTENT";
    }

    private String compareTopeers(double userAvgHours, double departmentAvg) {
        if (userAvgHours > departmentAvg + 5) return "ABOVE_AVERAGE";
        if (userAvgHours < departmentAvg - 5) return "BELOW_AVERAGE";
        return "AVERAGE";
    }

    private double getDepartmentAverageHours(String userId) {
        // In real implementation, calculate from database
        return 40.0 + (Math.random() * 10); // Simulate 40-50 hours average
    }

    private int calculateContinuousWorkingDays(List<TimeRecord> timeRecords) {
        if (timeRecords.isEmpty()) return 0;

        List<LocalDate> workDays = timeRecords.stream()
            .map(TimeRecord::getDate)
            .distinct()
            .sorted(Comparator.reverseOrder())
            .collect(Collectors.toList());

        int continuousDays = 0;
        LocalDate expectedDate = LocalDate.now();

        for (LocalDate workDay : workDays) {
            if (workDay.equals(expectedDate) || workDay.equals(expectedDate.minusDays(1))) {
                continuousDays++;
                expectedDate = workDay.minusDays(1);
            } else {
                break;
            }
        }

        return continuousDays;
    }

    private LocalDate findLastRestDay(List<TimeRecord> timeRecords) {
        Set<LocalDate> workDays = timeRecords.stream()
            .map(TimeRecord::getDate)
            .collect(Collectors.toSet());

        LocalDate date = LocalDate.now().minusDays(1);
        while (date.isAfter(LocalDate.now().minusMonths(1))) {
            if (!workDays.contains(date)) {
                return date;
            }
            date = date.minusDays(1);
        }

        return null;
    }

    private String calculateDailyWorkQuality(List<TimeRecord> dayRecords) {
        double totalHours = dayRecords.stream().mapToDouble(TimeRecord::getTotalHours).sum();
        double productiveHours = dayRecords.stream().mapToDouble(TimeRecord::getProductiveHours).sum();
        int tasksCompleted = dayRecords.stream().mapToInt(TimeRecord::getTasksCompleted).sum();

        double productivityRatio = totalHours > 0 ? productiveHours / totalHours : 0;

        if (productivityRatio > 0.85 && tasksCompleted >= 3) return "EXCELLENT";
        if (productivityRatio > 0.75 && tasksCompleted >= 2) return "GOOD";
        if (productivityRatio > 0.60 && tasksCompleted >= 1) return "AVERAGE";
        return "POOR";
    }

    private double calculateWeeklyProductivity(List<TimeRecord> weekRecords) {
        double totalHours = weekRecords.stream().mapToDouble(TimeRecord::getTotalHours).sum();
        double productiveHours = weekRecords.stream().mapToDouble(TimeRecord::getProductiveHours).sum();
        return totalHours > 0 ? (productiveHours / totalHours) * 100 : 0;
    }

    private double calculateVariance(List<Double> values) {
        if (values.size() < 2) return 0;

        double mean = values.stream().mapToDouble(Double::doubleValue).average().orElse(0);
        return values.stream()
            .mapToDouble(v -> Math.pow(v - mean, 2))
            .average()
            .orElse(0);
    }

    private double calculateTrend(List<Double> values) {
        if (values.size() < 2) return 0;
        return values.get(values.size() - 1) - values.get(0);
    }

    private List<TimeRecord> generateSampleTimeData() {
        List<TimeRecord> sampleData = new ArrayList<>();
        LocalDate startDate = LocalDate.now().minusDays(30);

        for (int i = 0; i < 30; i++) {
            LocalDate date = startDate.plusDays(i);
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                sampleData.add(TimeRecord.builder()
                    .date(date)
                    .startTime(date.atTime(9, 0))
                    .endTime(date.atTime(17, 30))
                    .totalHours(8.0 + (Math.random() * 2))
                    .productiveHours(6.5 + (Math.random() * 1.5))
                    .breakHours(1.0 + (Math.random() * 0.5))
                    .projectId("PROJ-" + (i % 3 + 1))
                    .taskType("DEVELOPMENT")
                    .tasksCompleted((int) (1 + Math.random() * 3))
                    .build());
            }
        }

        return sampleData;
    }

    // Inner classes
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class TimeRecord {
        LocalDate date;
        LocalDateTime startTime;
        LocalDateTime endTime;
        Double totalHours;
        Double productiveHours;
        Double breakHours;
        String projectId;
        String taskType;
        Integer tasksCompleted;
    }

    private static class TimeStatistics {
        double hoursThisWeek;
        double hoursThisMonth;
        double hoursThisYear;
        double avgHoursPerDay;
        double avgHoursPerWeek;
        double avgHoursPerMonth;
        double productiveHoursPercentage;
        double overtimeHours;
        double regularHours;
        Map<String, Double> timeByProject = new HashMap<>();
        Map<String, Double> timeByTaskType = new HashMap<>();
        Map<String, Double> timeByDay = new HashMap<>();
        double avgBreakTimePerDay;
        int continuousWorkingDays;
        LocalDate lastRestDay;
    }
}
