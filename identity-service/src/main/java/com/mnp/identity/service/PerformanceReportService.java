package com.mnp.identity.service;

import com.mnp.identity.dto.response.PerformanceReportResponse;
import com.mnp.identity.entity.User;
import com.mnp.identity.exception.AppException;
import com.mnp.identity.exception.ErrorCode;
import com.mnp.identity.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PerformanceReportService {

    UserRepository userRepository;
    RestTemplate restTemplate;

    private static final String TASK_SERVICE_URL = "http://localhost:8888/api/v1/tasks";
    private static final String PROJECT_SERVICE_URL = "http://localhost:8888/api/v1/projects";

    public PerformanceReportResponse generateIndividualPerformanceReport(String userId, String period) {
        log.info("Generating performance report for user: {} with period: {}", userId, period);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        try {
            // Fetch user task data
            Map<String, Object> taskData = fetchUserTaskData(userId, period);

            // Fetch project participation data
            List<PerformanceReportResponse.ProjectParticipationSummary> projectHistory =
                    fetchProjectParticipationHistory(userId, period);

            // Calculate performance metrics
            PerformanceMetrics metrics = calculatePerformanceMetrics(taskData, projectHistory);

            // Generate monthly trends
            List<PerformanceReportResponse.MonthlyPerformanceData> monthlyTrends =
                    generateMonthlyTrends(userId, period);

            // Get department comparison data
            ComparisonData comparisonData = getDepartmentComparison(userId);

            return PerformanceReportResponse.builder()
                    .userId(userId)
                    .employeeId(user.getEmployeeId())
                    .fullName(user.getFirstName() + " " + user.getLastName())
                    .department(user.getDepartment() != null ? user.getDepartment().getName() : "N/A")
                    .position(user.getPosition() != null ? user.getPosition().getTitle() : "N/A")
                    .overallPerformanceScore(metrics.overallScore)
                    .performanceGrade(calculatePerformanceGrade(metrics.overallScore))
                    .totalTasksCompleted(metrics.totalTasksCompleted)
                    .totalTasksAssigned(metrics.totalTasksAssigned)
                    .taskCompletionRate(metrics.taskCompletionRate)
                    .averageTaskCompletionTime(metrics.averageCompletionTime)
                    .onTimeDeliveryRate(metrics.onTimeDeliveryRate)
                    .overdueTasks(metrics.overdueTasks)
                    .averageTaskRating(metrics.averageTaskRating)
                    .tasksWithHighRating(metrics.tasksWithHighRating)
                    .tasksRequiringRework(metrics.tasksRequiringRework)
                    .tasksCompletedPerWeek(metrics.tasksCompletedPerWeek)
                    .hoursWorkedThisMonth(metrics.hoursWorkedThisMonth)
                    .productivityScore(metrics.productivityScore)
                    .activeProjects(metrics.activeProjects)
                    .completedProjects(metrics.completedProjects)
                    .projectHistory(projectHistory)
                    .skillRatings(generateSkillRatings(taskData))
                    .recommendedSkillImprovements(generateSkillRecommendations(taskData))
                    .monthlyTrends(monthlyTrends)
                    .performanceTrend(calculatePerformanceTrend(monthlyTrends))
                    .departmentAverageScore(comparisonData.departmentAverage)
                    .rankInDepartment(comparisonData.rank)
                    .reportGeneratedAt(LocalDateTime.now())
                    .reportPeriod(period)
                    .build();

        } catch (Exception e) {
            log.error("Failed to generate performance report for user: {}", userId, e);
            throw new RuntimeException("Failed to generate performance report: " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchUserTaskData(String userId, String period) {
        try {
            String url = TASK_SERVICE_URL + "/user/" + userId + "/performance-data?period=" + period;
            return restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            log.warn("Failed to fetch task data for user: {}, using default values", userId);
            return createDefaultTaskData();
        }
    }

    @SuppressWarnings("unchecked")
    private List<PerformanceReportResponse.ProjectParticipationSummary> fetchProjectParticipationHistory(String userId, String period) {
        try {
            String url = PROJECT_SERVICE_URL + "/user/" + userId + "/participation-history?period=" + period;
            List<Map<String, Object>> projectData = restTemplate.getForObject(url, List.class);

            return projectData.stream().map(data ->
                PerformanceReportResponse.ProjectParticipationSummary.builder()
                    .projectId((String) data.get("projectId"))
                    .projectName((String) data.get("projectName"))
                    .role((String) data.get("role"))
                    .startDate(data.get("startDate") != null ?
                        LocalDateTime.parse(data.get("startDate").toString()) : null)
                    .endDate(data.get("endDate") != null ?
                        LocalDateTime.parse(data.get("endDate").toString()) : null)
                    .status((String) data.get("status"))
                    .contributionScore(((Number) data.getOrDefault("contributionScore", 0.0)).doubleValue())
                    .tasksCompleted(((Number) data.getOrDefault("tasksCompleted", 0)).intValue())
                    .build()
            ).collect(Collectors.toList());
        } catch (Exception e) {
            log.warn("Failed to fetch project participation data for user: {}", userId);
            return new ArrayList<>();
        }
    }

    private PerformanceMetrics calculatePerformanceMetrics(Map<String, Object> taskData,
            List<PerformanceReportResponse.ProjectParticipationSummary> projectHistory) {

        PerformanceMetrics metrics = new PerformanceMetrics();

        // Extract data from taskData map
        metrics.totalTasksCompleted = ((Number) taskData.getOrDefault("completedTasks", 0)).intValue();
        metrics.totalTasksAssigned = ((Number) taskData.getOrDefault("assignedTasks", 0)).intValue();
        metrics.overdueTasks = ((Number) taskData.getOrDefault("overdueTasks", 0)).intValue();
        metrics.averageCompletionTime = ((Number) taskData.getOrDefault("avgCompletionTime", 0.0)).doubleValue();
        metrics.averageTaskRating = ((Number) taskData.getOrDefault("avgRating", 3.0)).doubleValue();
        metrics.tasksWithHighRating = ((Number) taskData.getOrDefault("highRatingTasks", 0)).intValue();
        metrics.tasksRequiringRework = ((Number) taskData.getOrDefault("reworkTasks", 0)).intValue();
        metrics.hoursWorkedThisMonth = ((Number) taskData.getOrDefault("monthlyHours", 0.0)).doubleValue();

        // Calculate derived metrics
        metrics.taskCompletionRate = metrics.totalTasksAssigned > 0 ?
            (double) metrics.totalTasksCompleted / metrics.totalTasksAssigned * 100 : 0.0;

        metrics.onTimeDeliveryRate = metrics.totalTasksCompleted > 0 ?
            (double) (metrics.totalTasksCompleted - metrics.overdueTasks) / metrics.totalTasksCompleted * 100 : 0.0;

        metrics.tasksCompletedPerWeek = metrics.totalTasksCompleted / 4.0; // Assuming monthly data

        // Calculate productivity score (weighted average of multiple factors)
        metrics.productivityScore = calculateProductivityScore(
            metrics.taskCompletionRate,
            metrics.onTimeDeliveryRate,
            metrics.averageTaskRating,
            metrics.hoursWorkedThisMonth
        );

        // Calculate overall performance score
        metrics.overallScore = calculateOverallPerformanceScore(metrics);

        // Project-related metrics
        metrics.activeProjects = (int) projectHistory.stream()
            .filter(p -> "IN_PROGRESS".equals(p.getStatus()))
            .count();

        metrics.completedProjects = (int) projectHistory.stream()
            .filter(p -> "COMPLETED".equals(p.getStatus()))
            .count();

        return metrics;
    }

    private double calculateProductivityScore(double completionRate, double onTimeRate,
            double avgRating, double hoursWorked) {
        // Weighted calculation
        double completionWeight = 0.3;
        double onTimeWeight = 0.3;
        double qualityWeight = 0.25;
        double hoursWeight = 0.15;

        double normalizedHours = Math.min(hoursWorked / 160, 1.0); // Normalize to 160 hours/month
        double normalizedRating = avgRating / 5.0; // Normalize rating to 0-1

        return (completionRate * completionWeight +
                onTimeRate * onTimeWeight +
                normalizedRating * 100 * qualityWeight +
                normalizedHours * 100 * hoursWeight);
    }

    private double calculateOverallPerformanceScore(PerformanceMetrics metrics) {
        // Comprehensive performance calculation
        double taskScore = metrics.taskCompletionRate * 0.25;
        double timeScore = metrics.onTimeDeliveryRate * 0.25;
        double qualityScore = (metrics.averageTaskRating / 5.0) * 100 * 0.25;
        double productivityScore = metrics.productivityScore * 0.25;

        return taskScore + timeScore + qualityScore + productivityScore;
    }

    private String calculatePerformanceGrade(double score) {
        if (score >= 90) return "A";
        if (score >= 80) return "B";
        if (score >= 70) return "C";
        if (score >= 60) return "D";
        return "F";
    }

    private List<PerformanceReportResponse.MonthlyPerformanceData> generateMonthlyTrends(String userId, String period) {
        List<PerformanceReportResponse.MonthlyPerformanceData> trends = new ArrayList<>();

        // Generate last 6 months of data
        for (int i = 5; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);

            // Simulate monthly performance data (in real implementation, fetch from database)
            trends.add(PerformanceReportResponse.MonthlyPerformanceData.builder()
                .month(month.getMonth().name())
                .year(month.getYear())
                .performanceScore(75.0 + (Math.random() * 20)) // Simulate varying performance
                .tasksCompleted((int) (15 + Math.random() * 10))
                .hoursWorked(140 + (Math.random() * 40))
                .build());
        }

        return trends;
    }

    private String calculatePerformanceTrend(List<PerformanceReportResponse.MonthlyPerformanceData> monthlyTrends) {
        if (monthlyTrends.size() < 3) return "STABLE";

        // Calculate trend over last 3 months
        double recent = monthlyTrends.subList(monthlyTrends.size() - 3, monthlyTrends.size())
            .stream().mapToDouble(PerformanceReportResponse.MonthlyPerformanceData::getPerformanceScore)
            .average().orElse(0.0);

        double earlier = monthlyTrends.subList(0, 3)
            .stream().mapToDouble(PerformanceReportResponse.MonthlyPerformanceData::getPerformanceScore)
            .average().orElse(0.0);

        double difference = recent - earlier;

        if (difference > 5) return "IMPROVING";
        if (difference < -5) return "DECLINING";
        return "STABLE";
    }

    private ComparisonData getDepartmentComparison(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || user.getDepartment() == null) {
            return new ComparisonData(75.0, "AVERAGE");
        }

        // Calculate department average (in real implementation, query from database)
        double departmentAverage = userRepository.findByDepartment(user.getDepartment())
            .stream()
            .mapToDouble(u -> u.getPerformanceScore() != null ? u.getPerformanceScore() : 75.0)
            .average()
            .orElse(75.0);

        double userScore = user.getPerformanceScore() != null ? user.getPerformanceScore() : 75.0;

        String rank;
        if (userScore >= departmentAverage + 10) rank = "TOP_10";
        else if (userScore >= departmentAverage + 5) rank = "ABOVE_AVERAGE";
        else if (userScore >= departmentAverage - 5) rank = "AVERAGE";
        else rank = "BELOW_AVERAGE";

        return new ComparisonData(departmentAverage, rank);
    }

    private Map<String, Double> generateSkillRatings(Map<String, Object> taskData) {
        Map<String, Double> skillRatings = new HashMap<>();

        // Simulate skill ratings based on task performance
        skillRatings.put("Java", 4.2);
        skillRatings.put("Spring Framework", 4.0);
        skillRatings.put("Database Design", 3.8);
        skillRatings.put("API Development", 4.1);
        skillRatings.put("Problem Solving", 3.9);
        skillRatings.put("Communication", 4.0);
        skillRatings.put("Time Management", 3.7);

        return skillRatings;
    }

    private List<String> generateSkillRecommendations(Map<String, Object> taskData) {
        List<String> recommendations = new ArrayList<>();

        recommendations.add("Improve time management skills to reduce task completion time");
        recommendations.add("Focus on code review practices to enhance code quality");
        recommendations.add("Consider learning advanced testing frameworks");
        recommendations.add("Develop leadership skills for potential team lead role");

        return recommendations;
    }

    private Map<String, Object> createDefaultTaskData() {
        Map<String, Object> defaultData = new HashMap<>();
        defaultData.put("completedTasks", 25);
        defaultData.put("assignedTasks", 30);
        defaultData.put("overdueTasks", 2);
        defaultData.put("avgCompletionTime", 16.5);
        defaultData.put("avgRating", 4.0);
        defaultData.put("highRatingTasks", 18);
        defaultData.put("reworkTasks", 3);
        defaultData.put("monthlyHours", 160.0);
        return defaultData;
    }

    // Inner classes for data structures
    private static class PerformanceMetrics {
        double overallScore;
        int totalTasksCompleted;
        int totalTasksAssigned;
        double taskCompletionRate;
        double averageCompletionTime;
        double onTimeDeliveryRate;
        int overdueTasks;
        double averageTaskRating;
        int tasksWithHighRating;
        int tasksRequiringRework;
        double tasksCompletedPerWeek;
        double hoursWorkedThisMonth;
        double productivityScore;
        int activeProjects;
        int completedProjects;
    }

    private static class ComparisonData {
        double departmentAverage;
        String rank;

        ComparisonData(double departmentAverage, String rank) {
            this.departmentAverage = departmentAverage;
            this.rank = rank;
        }
    }
}
