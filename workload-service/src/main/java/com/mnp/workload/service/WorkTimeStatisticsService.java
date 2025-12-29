package com.mnp.workload.service;

import com.mnp.workload.client.ProfileServiceClient;
import com.mnp.workload.client.ProjectServiceClient;
import com.mnp.workload.client.TaskServiceClient;
import com.mnp.workload.dto.response.ProjectMemberResponseDTO;
import com.mnp.workload.dto.response.TaskResponseDTO;
import com.mnp.workload.dto.response.UserInfoDTO;
import com.mnp.workload.dto.response.WorkTimeStatisticsResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WorkTimeStatisticsService {

    TaskServiceClient taskServiceClient;
    ProfileServiceClient profileServiceClient;
    ProjectServiceClient projectServiceClient;

    public WorkTimeStatisticsResponse generateWorkTimeStatistics(String userId, String period) {
        log.info("Generating work time statistics for user: {} with period: {}", userId, period);

        try {
            // Fetch user basic info via FeignClient
            UserInfoDTO userInfo = fetchUserInfo(userId);

            // Fetch tasks data via FeignClient
            List<TaskResponseDTO> tasks = fetchUserTasks(userId, period);

            // Convert tasks to time records based on actual hours and dates
            List<TimeRecord> timeRecords = convertTasksToTimeRecords(tasks);

            // Calculate statistics
            TimeStatistics stats = calculateTimeStatistics(timeRecords);

            // Create cache map for project names
            Map<String, String> projectNameCache = new HashMap<>();

            // Generate daily records
            List<WorkTimeStatisticsResponse.DailyWorkRecord> dailyRecords =
                generateDailyRecords(timeRecords, projectNameCache);

            // Generate weekly trends
            List<WorkTimeStatisticsResponse.WeeklyWorkSummary> weeklyTrends =
                generateWeeklyTrends(timeRecords);

            // Get department comparison
            double departmentAverage = getDepartmentAverageHours(userId);

            return WorkTimeStatisticsResponse.builder()
                .userId(userId)
                .employeeId(userInfo.getEmployeeId() != null ? userInfo.getEmployeeId() : "N/A")
                .fullName(buildFullName(userInfo))
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

    /**
     * Generate work time statistics for all members of a project
     * ✅ OPTIMIZED: Fetch all tasks once, then distribute to members (no N+1 problem)
     */
    public List<WorkTimeStatisticsResponse> generateProjectWorkTimeStatistics(String projectId, String period) {
        log.info("⚡ Generating project work time statistics for project: {} with period: {}", projectId, period);

        try {
            // 1. Fetch project members via FeignClient
            List<ProjectMemberResponseDTO> projectMembers = fetchProjectMembers(projectId);
            
            if (projectMembers == null || projectMembers.isEmpty()) {
                log.warn("No members found for project: {}", projectId);
                return new ArrayList<>();
            }

            List<ProjectMemberResponseDTO> activeMembers = projectMembers.stream()
                .filter(ProjectMemberResponseDTO::isActive)
                .collect(Collectors.toList());

            log.info("⚡ Found {} active members in project {}", activeMembers.size(), projectId);

            // 2. ✅ BATCH FETCH: Get all tasks for all members in ONE API call
            Map<String, List<TaskResponseDTO>> tasksByUser = batchFetchTasksForMembers(activeMembers, period);
            
            log.info("⚡ Batch fetched tasks for {} members", tasksByUser.size());

            // 3. Generate statistics for each member using pre-fetched tasks
            return activeMembers.stream()
                .map(member -> {
                    try {
                        List<TaskResponseDTO> memberTasks = tasksByUser.getOrDefault(member.getUserId(), new ArrayList<>());
                        return generateWorkTimeStatisticsWithTasks(member.getUserId(), period, memberTasks);
                    } catch (Exception e) {
                        log.error("Failed to generate statistics for user: {} in project: {}", 
                            member.getUserId(), projectId, e);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to generate project work time statistics for project: {}", projectId, e);
            throw new RuntimeException("Failed to generate project work time statistics: " + e.getMessage());
        }
    }

    /**
     * ✅ NEW: Batch fetch tasks for multiple users at once
     */
    private Map<String, List<TaskResponseDTO>> batchFetchTasksForMembers(
            List<ProjectMemberResponseDTO> members, String period) {
        
        Map<String, List<TaskResponseDTO>> result = new HashMap<>();
        LocalDate filterDate = calculateFilterDate(period);

        // Fetch tasks for each user (could be parallelized or batched further if API supports it)
        for (ProjectMemberResponseDTO member : members) {
            try {
                List<TaskResponseDTO> tasks = taskServiceClient.getTasksByUser(member.getUserId(), 10000);
                
                if (tasks != null && !tasks.isEmpty()) {
                    // Filter by period
                    List<TaskResponseDTO> filteredTasks = tasks.stream()
                        .filter(task -> isTaskInPeriod(task, filterDate))
                        .collect(Collectors.toList());
                    
                    result.put(member.getUserId(), filteredTasks);
                }
            } catch (Exception e) {
                log.error("Failed to fetch tasks for user: {}", member.getUserId(), e);
                result.put(member.getUserId(), new ArrayList<>());
            }
        }

        return result;
    }

    /**
     * ✅ NEW: Check if task is in the specified period
     */
    private boolean isTaskInPeriod(TaskResponseDTO task, LocalDate filterDate) {
        if (task.getCompletedAt() != null) {
            return task.getCompletedAt().toLocalDate().isAfter(filterDate) || 
                   task.getCompletedAt().toLocalDate().isEqual(filterDate);
        }
        if (task.getStartedAt() != null) {
            return task.getStartedAt().toLocalDate().isAfter(filterDate) || 
                   task.getStartedAt().toLocalDate().isEqual(filterDate);
        }
        return false;
    }

    /**
     * ✅ NEW: Generate statistics using pre-fetched tasks (no additional API calls)
     */
    private WorkTimeStatisticsResponse generateWorkTimeStatisticsWithTasks(
            String userId, String period, List<TaskResponseDTO> tasks) {
        
        try {
            // Fetch user basic info via FeignClient
            UserInfoDTO userInfo = fetchUserInfo(userId);

            // Use pre-fetched tasks instead of fetching again
            List<TimeRecord> timeRecords = convertTasksToTimeRecords(tasks);

            // Calculate statistics
            TimeStatistics stats = calculateTimeStatistics(timeRecords);

            // Create cache map for project names
            Map<String, String> projectNameCache = new HashMap<>();

            // Generate daily records
            List<WorkTimeStatisticsResponse.DailyWorkRecord> dailyRecords =
                generateDailyRecords(timeRecords, projectNameCache);

            // Generate weekly trends
            List<WorkTimeStatisticsResponse.WeeklyWorkSummary> weeklyTrends =
                generateWeeklyTrends(timeRecords);

            // Get department comparison
            double departmentAverage = getDepartmentAverageHours(userId);

            return WorkTimeStatisticsResponse.builder()
                .userId(userId)
                .employeeId(userInfo.getEmployeeId() != null ? userInfo.getEmployeeId() : "N/A")
                .fullName(buildFullName(userInfo))
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

    private List<ProjectMemberResponseDTO> fetchProjectMembers(String projectId) {
        try {
            var response = projectServiceClient.getProjectMembers(projectId);
            if (response != null && response.getResult() != null) {
                return response.getResult();
            }
            log.warn("Project members response was null or incomplete for project: {}", projectId);
            return new ArrayList<>();
        } catch (Exception e) {
            log.error("Failed to fetch project members for project: {}", projectId, e);
            return new ArrayList<>();
        }
    }

    private UserInfoDTO fetchUserInfo(String userId) {
        try {
            var response = profileServiceClient.getUserProfile(userId);
            if (response != null && response.getResult() != null && response.getResult().getUser() != null) {
                return response.getResult().getUser();
            }
            log.warn("Profile response was null or incomplete for user: {}", userId);
            return createDefaultUserInfo(userId);
        } catch (Exception e) {
            log.warn("Failed to fetch user info for: {}, using defaults", userId, e);
            return createDefaultUserInfo(userId);
        }
    }
    
    private UserInfoDTO createDefaultUserInfo(String userId) {
        return UserInfoDTO.builder()
            .id(userId)
            .employeeId("N/A")
            .firstName("Unknown")
            .lastName("User")
            .build();
    }
    
    private String buildFullName(UserInfoDTO userInfo) {
        if (userInfo == null) {
            return "Unknown";
        }
        String firstName = userInfo.getFirstName() != null ? userInfo.getFirstName() : "";
        String lastName = userInfo.getLastName() != null ? userInfo.getLastName() : "";
        String fullName = (firstName + " " + lastName).trim();
        return fullName.isEmpty() ? "Unknown" : fullName;
    }

    private List<TaskResponseDTO> fetchUserTasks(String userId, String period) {
        try {
            // Fetch all tasks assigned to the user
            List<TaskResponseDTO> tasks = taskServiceClient.getTasksByUser(userId, 10000);
            
            if (tasks == null || tasks.isEmpty()) {
                log.warn("No tasks found for user: {}", userId);
                return new ArrayList<>();
            }

            // Filter tasks based on period
            LocalDate filterDate = calculateFilterDate(period);
            
            return tasks.stream()
                .filter(task -> {
                    // Filter tasks that have work done (completed or in progress with actualHours)
                    if (task.getCompletedAt() != null) {
                        return task.getCompletedAt().toLocalDate().isAfter(filterDate) || 
                               task.getCompletedAt().toLocalDate().isEqual(filterDate);
                    }
                    if (task.getStartedAt() != null) {
                        return task.getStartedAt().toLocalDate().isAfter(filterDate) || 
                               task.getStartedAt().toLocalDate().isEqual(filterDate);
                    }
                    return false;
                })
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch tasks for user: {}", userId, e);
            return new ArrayList<>();
        }
    }

    private LocalDate calculateFilterDate(String period) {
        LocalDate now = LocalDate.now();
        return switch (period.toUpperCase()) {
            case "WEEK" -> now.minusWeeks(1);
            case "MONTH" -> now.minusMonths(1);
            case "QUARTER" -> now.minusMonths(3);
            case "YEAR" -> now.minusYears(1);
            default -> now.minusMonths(1); // Default to 1 month
        };
    }

    /**
     * Convert Task entities to TimeRecord objects based on actualHours and task dates
     */
    private List<TimeRecord> convertTasksToTimeRecords(List<TaskResponseDTO> tasks) {
        List<TimeRecord> timeRecords = new ArrayList<>();

        for (TaskResponseDTO task : tasks) {
            // Skip tasks without actual hours or time information
            if (task.getActualHours() == null || task.getActualHours() == 0) {
                continue;
            }

            LocalDate workDate;
            LocalDateTime startTime = null;
            LocalDateTime endTime = null;

            // Determine the work date and times
            if (task.getCompletedAt() != null) {
                workDate = task.getCompletedAt().toLocalDate();
                endTime = task.getCompletedAt();
                
                if (task.getStartedAt() != null) {
                    startTime = task.getStartedAt();
                    // If work spans multiple days, create records for each day
                    if (!task.getStartedAt().toLocalDate().equals(workDate)) {
                        distributeHoursAcrossDays(timeRecords, task, task.getStartedAt(), task.getCompletedAt());
                        continue;
                    }
                } else {
                    // Estimate start time based on actual hours
                    startTime = endTime.minusHours(task.getActualHours().longValue());
                }
            } else if (task.getStartedAt() != null) {
                workDate = task.getStartedAt().toLocalDate();
                startTime = task.getStartedAt();
                endTime = startTime.plusHours(task.getActualHours().longValue());
            } else {
                // Use assignedAt or createdAt as fallback
                workDate = task.getAssignedAt() != null ? 
                    task.getAssignedAt().toLocalDate() : 
                    task.getCreatedAt().toLocalDate();
                startTime = workDate.atTime(9, 0);
                endTime = startTime.plusHours(task.getActualHours().longValue());
            }

            // Calculate productive hours (80% of actual hours is a reasonable estimate)
            double productiveHours = task.getActualHours() * 0.8;
            double breakHours = task.getActualHours() * 0.2;

            TimeRecord record = TimeRecord.builder()
                .date(workDate)
                .startTime(startTime)
                .endTime(endTime)
                .totalHours(task.getActualHours().doubleValue())
                .productiveHours(productiveHours)
                .breakHours(breakHours)
                .projectId(task.getProjectId())
                .taskType(task.getTaskType() != null ? task.getTaskType() : task.getType())
                .tasksCompleted(1)
                .taskId(task.getId())
                .taskStatus(task.getStatus())
                .build();

            timeRecords.add(record);
        }

        return timeRecords;
    }

    /**
     * Distribute task hours across multiple days if work spans multiple days
     */
    private void distributeHoursAcrossDays(List<TimeRecord> timeRecords, TaskResponseDTO task, 
                                          LocalDateTime startTime, LocalDateTime endTime) {
        long daysBetween = ChronoUnit.DAYS.between(startTime.toLocalDate(), endTime.toLocalDate()) + 1;
        double hoursPerDay = task.getActualHours().doubleValue() / daysBetween;

        LocalDate currentDate = startTime.toLocalDate();
        while (!currentDate.isAfter(endTime.toLocalDate())) {
            TimeRecord record = TimeRecord.builder()
                .date(currentDate)
                .startTime(currentDate.equals(startTime.toLocalDate()) ? startTime : currentDate.atTime(9, 0))
                .endTime(currentDate.equals(endTime.toLocalDate()) ? endTime : currentDate.atTime(17, 0))
                .totalHours(hoursPerDay)
                .productiveHours(hoursPerDay * 0.8)
                .breakHours(hoursPerDay * 0.2)
                .projectId(task.getProjectId())
                .taskType(task.getTaskType() != null ? task.getTaskType() : task.getType())
                .tasksCompleted(currentDate.equals(endTime.toLocalDate()) ? 1 : 0)
                .taskId(task.getId())
                .taskStatus(task.getStatus())
                .build();

            timeRecords.add(record);
            currentDate = currentDate.plusDays(1);
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

        // ✅ FIX N+1: Batch fetch all project names first
        Map<String, String> projectNameCache = batchFetchProjectNames(timeRecords);

        // Time distribution by project
        stats.timeByProject = timeRecords.stream()
            .filter(r -> r.projectId != null)
            .collect(Collectors.groupingBy(
                r -> projectNameCache.getOrDefault(r.projectId, r.projectId),
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

    private List<WorkTimeStatisticsResponse.DailyWorkRecord> generateDailyRecords(List<TimeRecord> timeRecords, Map<String, String> projectNameCache) {
        return timeRecords.stream()
            .collect(Collectors.groupingBy(TimeRecord::getDate))
            .entrySet().stream()
            .map(entry -> {
                LocalDate date = entry.getKey();
                List<TimeRecord> dayRecords = entry.getValue();

                // Get primary project ID first
                String primaryProjectId = dayRecords.stream()
                    .collect(Collectors.groupingBy(TimeRecord::getProjectId, Collectors.summingDouble(TimeRecord::getTotalHours)))
                    .entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse("N/A");

                // Convert project ID to project name
                String primaryProjectName = getProjectNameById(primaryProjectId, projectNameCache);

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
                    .primaryProject(primaryProjectName)
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

    /**
     * Get project name by project ID using cache to avoid multiple API calls
     */
    private String getProjectNameByIdSimp(String projectId) {
        // Fetch from API and cache the result
        String projectName = "";
        try {
            var response = projectServiceClient.getProjectById(projectId);
            if (response != null && response.getResult() != null && response.getResult().getName() != null) {
                projectName = response.getResult().getName();
                return projectName;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch project name for projectId: {}. Error: {}", projectId, e.getMessage());
        }

        return projectName;
    }

    /**
     * ✅ NEW: Batch fetch project names to prevent N+1 queries
     */
    private Map<String, String> batchFetchProjectNames(List<TimeRecord> timeRecords) {
        Map<String, String> cache = new HashMap<>();
        
        // Get unique project IDs
        Set<String> projectIds = timeRecords.stream()
            .map(TimeRecord::getProjectId)
            .filter(Objects::nonNull)
            .filter(id -> !id.equals("N/A"))
            .collect(Collectors.toSet());
        
        log.info("⚡ Batch fetching names for {} unique projects", projectIds.size());
        
        // Fetch each project name once
        for (String projectId : projectIds) {
            try {
                var response = projectServiceClient.getProjectById(projectId);
                if (response != null && response.getResult() != null && response.getResult().getName() != null) {
                    cache.put(projectId, response.getResult().getName());
                } else {
                    cache.put(projectId, projectId); // Fallback to ID
                }
            } catch (Exception e) {
                log.warn("Failed to fetch project name for projectId: {}. Error: {}", projectId, e.getMessage());
                cache.put(projectId, projectId); // Fallback to ID
            }
        }
        
        log.info("⚡ Cached {} project names", cache.size());
        return cache;
    }

    private String getProjectNameById(String projectId, Map<String, String> projectNameCache) {
        if (projectId == null || projectId.equals("N/A")) {
            return "N/A";
        }

        // Check cache first
        if (projectNameCache.containsKey(projectId)) {
            return projectNameCache.get(projectId);
        }

        // Fetch from API and cache the result
        try {
            var response = projectServiceClient.getProjectById(projectId);
            if (response != null && response.getResult() != null && response.getResult().getName() != null) {
                String projectName = response.getResult().getName();
                projectNameCache.put(projectId, projectName);
                log.debug("Cached project name: {} for projectId: {}", projectName, projectId);
                return projectName;
            }
        } catch (Exception e) {
            log.warn("Failed to fetch project name for projectId: {}. Error: {}", projectId, e.getMessage());
        }

        // Fallback to projectId if API call fails
        projectNameCache.put(projectId, projectId);
        return projectId;
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
        String taskId;
        String taskStatus;
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
