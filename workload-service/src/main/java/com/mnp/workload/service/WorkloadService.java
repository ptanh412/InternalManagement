package com.mnp.workload.service;

import com.devteria.workload.dto.request.*;
import com.devteria.workload.dto.response.*;
import com.mnp.workload.dto.request.AddTaskToWorkloadRequest;
import com.mnp.workload.dto.request.UpdateCapacityRequest;
import com.mnp.workload.dto.request.UpdateTaskWorkloadRequest;
import com.mnp.workload.dto.response.*;
import com.mnp.workload.entity.UserCurrentTask;
import com.mnp.workload.entity.UserWorkload;
import com.mnp.workload.enums.TaskStatus;
import com.mnp.workload.repository.UserCurrentTaskRepository;
import com.mnp.workload.repository.UserWorkloadRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WorkloadService {

    UserWorkloadRepository userWorkloadRepository;
    UserCurrentTaskRepository userCurrentTaskRepository;

    // Get user's current workload & capacity
    public UserWorkloadResponse getUserWorkload(String userId) {
        UserWorkload workload = getOrCreateUserWorkload(userId);
        List<UserCurrentTask> currentTasks = userCurrentTaskRepository.findByUserId(userId);

        return UserWorkloadResponse.builder()
                .userId(userId)
                .weeklyCapacityHours(workload.getWeeklyCapacityHours())
                .dailyCapacityHours(workload.getDailyCapacityHours())
                .totalEstimateHours(workload.getTotalEstimateHours())
                .totalActualHours(workload.getTotalActualHours())
                .availabilityPercentage(workload.getAvailabilityPercentage())
                .nextAvailableDate(workload.getNextAvailableDate())
                .upcomingWeekHours(workload.getUpcomingWeekHours())
                .currentTasksCount(currentTasks.size())
                .utilizationPercentage(calculateUtilizationPercentage(workload))
                .lastUpdated(workload.getLastUpdated())
                .build();
    }

    // Update user capacity (hours/week)
    @Transactional
    public UserWorkloadResponse updateUserCapacity(String userId, UpdateCapacityRequest request) {
        UserWorkload workload = getOrCreateUserWorkload(userId);

        workload.setWeeklyCapacityHours(request.getWeeklyCapacityHours());
        workload.setDailyCapacityHours(request.getDailyCapacityHours());

        // Recalculate workload metrics
        recalculateWorkloadMetrics(workload);

        UserWorkload savedWorkload = userWorkloadRepository.save(workload);
        log.info("Updated capacity for user {}: {} hours/week", userId, request.getWeeklyCapacityHours());

        return getUserWorkload(userId);
    }

    // Check user availability for new tasks
    public UserAvailabilityResponse getUserAvailability(String userId) {
        UserWorkload workload = getOrCreateUserWorkload(userId);
        List<UserCurrentTask> currentTasks = userCurrentTaskRepository.findByUserId(userId);

        boolean isAvailable = workload.getAvailabilityPercentage() > 10.0; // Consider available if >10% capacity
        int availableHours = Math.max(0, workload.getWeeklyCapacityHours() - workload.getTotalEstimateHours());

        return UserAvailabilityResponse.builder()
                .userId(userId)
                .isAvailable(isAvailable)
                .availabilityPercentage(workload.getAvailabilityPercentage())
                .nextAvailableDate(workload.getNextAvailableDate())
                .currentTasksCount(currentTasks.size())
                .weeklyCapacity(workload.getWeeklyCapacityHours())
                .currentLoad(workload.getTotalEstimateHours())
                .build();
    }

    // Get team workload overview
    public TeamWorkloadResponse getTeamWorkload(String departmentId) {
        // Note: This would typically integrate with user/profile service to get department users
        // For now, we'll simulate getting users by department
        List<String> departmentUserIds = getDepartmentUserIds(departmentId);
        List<UserWorkload> teamWorkloads = userWorkloadRepository.findByUserIds(departmentUserIds);

        List<TeamWorkloadResponse.UserWorkloadSummary> teamMembers = teamWorkloads.stream()
                .map(this::mapToUserWorkloadSummary)
                .collect(Collectors.toList());

        double averageUtilization = teamMembers.stream()
                .mapToDouble(TeamWorkloadResponse.UserWorkloadSummary::getUtilizationPercentage)
                .average().orElse(0.0);

        int totalCapacity = teamMembers.stream()
                .mapToInt(TeamWorkloadResponse.UserWorkloadSummary::getCapacityHours)
                .sum();

        int totalAllocated = teamMembers.stream()
                .mapToInt(TeamWorkloadResponse.UserWorkloadSummary::getAllocatedHours)
                .sum();

        return TeamWorkloadResponse.builder()
                .departmentId(departmentId)
                .departmentName("Department " + departmentId) // Would get from user service
                .totalTeamMembers(teamMembers.size())
                .averageUtilization(averageUtilization)
                .totalCapacityHours(totalCapacity)
                .totalAllocatedHours(totalAllocated)
                .teamMembers(teamMembers)
                .build();
    }

    // Get available users for assignment
    public AvailableUsersResponse getAvailableUsers() {
        List<UserWorkload> availableWorkloads = userWorkloadRepository.findAvailableUsers(20.0); // >20% availability

        List<AvailableUsersResponse.AvailableUser> availableUsers = availableWorkloads.stream()
                .map(this::mapToAvailableUser)
                .collect(Collectors.toList());

        return AvailableUsersResponse.builder()
                .availableUsers(availableUsers)
                .totalAvailableUsers(availableUsers.size())
                .build();
    }

    // Suggest workload rebalancing for project
    public WorkloadOptimizationResponse optimizeWorkloadForProject(String projectId) {
        List<UserCurrentTask> projectTasks = userCurrentTaskRepository.findByProjectId(projectId);

        // Analyze current distribution
        List<WorkloadOptimizationResponse.WorkloadRebalancingSuggestion> suggestions =
                generateOptimizationSuggestions(projectTasks);

        double currentUtilization = calculateProjectUtilization(projectTasks);
        double optimizedUtilization = Math.min(95.0, currentUtilization + 10.0);

        return WorkloadOptimizationResponse.builder()
                .projectId(projectId)
                .projectName("Project " + projectId) // Would get from project service
                .optimizationStatus(suggestions.isEmpty() ? "OPTIMAL" : "NEEDS_REBALANCING")
                .suggestions(suggestions)
                .currentProjectUtilization(currentUtilization)
                .optimizedProjectUtilization(optimizedUtilization)
                .estimatedCompletionImprovement(suggestions.isEmpty() ? "0 days" : "3-5 days")
                .build();
    }

    // Add task to user workload (when assigned)
    @Transactional
    public UserCurrentTaskResponse addTaskToWorkload(String userId, AddTaskToWorkloadRequest request) {
        UserWorkload workload = getOrCreateUserWorkload(userId);

        // Check if task already exists
        if (userCurrentTaskRepository.findByTaskId(request.getTaskId()).isPresent()) {
            throw new RuntimeException("Task already exists in workload");
        }

        UserCurrentTask currentTask = UserCurrentTask.builder()
                .userId(userId)
                .taskId(request.getTaskId())
                .projectId(request.getProjectId())
                .estimatedHours(request.getEstimatedHours())
                .remainingHours(request.getEstimatedHours())
                .actualHoursSpent(0)
                .priority(request.getPriority())
                .status(TaskStatus.TODO)
                .dueDate(request.getDueDate())
                .taskTitle(request.getTaskTitle())
                .assignedDate(LocalDateTime.now())
                .build();

        UserCurrentTask savedTask = userCurrentTaskRepository.save(currentTask);

        // Update workload metrics
        workload.setTotalEstimateHours(workload.getTotalEstimateHours() + request.getEstimatedHours());
        recalculateWorkloadMetrics(workload);
        userWorkloadRepository.save(workload);

        log.info("Added task {} to user {} workload", request.getTaskId(), userId);

        return mapToUserCurrentTaskResponse(savedTask);
    }

    // Update task hours/progress
    @Transactional
    public UserCurrentTaskResponse updateTaskWorkload(String taskId, UpdateTaskWorkloadRequest request) {
        UserCurrentTask task = userCurrentTaskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found in workload"));

        String userId = task.getUserId();
        UserWorkload workload = getOrCreateUserWorkload(userId);

        // Update task details
        if (request.getEstimatedHours() != null) {
            int hoursDifference = request.getEstimatedHours() - task.getEstimatedHours();
            task.setEstimatedHours(request.getEstimatedHours());
            workload.setTotalEstimateHours(workload.getTotalEstimateHours() + hoursDifference);
        }

        if (request.getActualHoursSpent() != null) {
            int hoursDifference = request.getActualHoursSpent() - task.getActualHoursSpent();
            task.setActualHoursSpent(request.getActualHoursSpent());
            workload.setTotalActualHours(workload.getTotalActualHours() + hoursDifference);
        }

        if (request.getProgressPercentage() != null) {
            task.setProgressPercentage(request.getProgressPercentage());
            // Update remaining hours based on progress
            int newRemainingHours = (int) (task.getEstimatedHours() * (1.0 - request.getProgressPercentage() / 100.0));
            task.setRemainingHours(Math.max(0, newRemainingHours));
        }

        if (request.getRemainingHours() != null) {
            task.setRemainingHours(request.getRemainingHours());
        }

        UserCurrentTask updatedTask = userCurrentTaskRepository.save(task);

        // Recalculate workload metrics
        recalculateWorkloadMetrics(workload);
        userWorkloadRepository.save(workload);

        log.info("Updated task {} workload for user {}", taskId, userId);

        return mapToUserCurrentTaskResponse(updatedTask);
    }

    // Remove task from workload (when completed)
    @Transactional
    public void removeTaskFromWorkload(String taskId) {
        UserCurrentTask task = userCurrentTaskRepository.findByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found in workload"));

        String userId = task.getUserId();
        UserWorkload workload = getOrCreateUserWorkload(userId);

        // Update workload metrics
        workload.setTotalEstimateHours(workload.getTotalEstimateHours() - task.getEstimatedHours());
        workload.setTotalActualHours(workload.getTotalActualHours() - task.getActualHoursSpent());

        // Remove task
        userCurrentTaskRepository.delete(task);

        // Recalculate workload metrics
        recalculateWorkloadMetrics(workload);
        userWorkloadRepository.save(workload);

        log.info("Removed task {} from user {} workload", taskId, userId);
    }

    // Helper methods
    private UserWorkload getOrCreateUserWorkload(String userId) {
        return userWorkloadRepository.findByUserId(userId)
                .orElseGet(() -> createDefaultUserWorkload(userId));
    }

    private UserWorkload createDefaultUserWorkload(String userId) {
        UserWorkload workload = UserWorkload.builder()
                .userId(userId)
                .weeklyCapacityHours(40)
                .dailyCapacityHours(8)
                .totalEstimateHours(0)
                .totalActualHours(0)
                .availabilityPercentage(100.0)
                .nextAvailableDate(LocalDate.now())
                .upcomingWeekHours(0)
                .build();

        return userWorkloadRepository.save(workload);
    }

    private void recalculateWorkloadMetrics(UserWorkload workload) {
        // Recalculate from actual tasks
        Integer totalEstimated = userCurrentTaskRepository.getTotalEstimatedHoursByUserId(workload.getUserId());
        Integer totalActual = userCurrentTaskRepository.getTotalActualHoursByUserId(workload.getUserId());

        workload.setTotalEstimateHours(totalEstimated != null ? totalEstimated : 0);
        workload.setTotalActualHours(totalActual != null ? totalActual : 0);

        // Calculate next available date
        if (workload.getTotalEstimateHours() >= workload.getWeeklyCapacityHours()) {
            int overloadWeeks = workload.getTotalEstimateHours() / workload.getWeeklyCapacityHours();
            workload.setNextAvailableDate(LocalDate.now().plusWeeks(overloadWeeks));
        } else {
            workload.setNextAvailableDate(LocalDate.now());
        }
    }

    private double calculateUtilizationPercentage(UserWorkload workload) {
        if (workload.getWeeklyCapacityHours() == 0) return 0.0;
        return (double) workload.getTotalEstimateHours() / workload.getWeeklyCapacityHours() * 100.0;
    }

    private TeamWorkloadResponse.UserWorkloadSummary mapToUserWorkloadSummary(UserWorkload workload) {
        double utilization = calculateUtilizationPercentage(workload);
        int availableHours = Math.max(0, workload.getWeeklyCapacityHours() - workload.getTotalEstimateHours());

        String status;
        if (utilization > 100) status = "Overloaded";
        else if (utilization > 90) status = "At Capacity";
        else status = "Available";

        return TeamWorkloadResponse.UserWorkloadSummary.builder()
                .userId(workload.getUserId())
                .userName("User " + workload.getUserId()) // Would get from user service
                .utilizationPercentage(utilization)
                .capacityHours(workload.getWeeklyCapacityHours())
                .allocatedHours(workload.getTotalEstimateHours())
                .availableHours(availableHours)
                .status(status)
                .build();
    }

    private AvailableUsersResponse.AvailableUser mapToAvailableUser(UserWorkload workload) {
        int availableHours = Math.max(0, workload.getWeeklyCapacityHours() - workload.getTotalEstimateHours());

        return AvailableUsersResponse.AvailableUser.builder()
                .userId(workload.getUserId())
                .userName("User " + workload.getUserId()) // Would get from user service
                .departmentId("DEPT001") // Would get from user service
                .availableHours(availableHours)
                .utilizationPercentage(calculateUtilizationPercentage(workload))
                .skillSet("Java, Spring, React") // Would get from user profile
                .nextAvailableDate(workload.getNextAvailableDate().toString())
                .build();
    }

    private UserCurrentTaskResponse mapToUserCurrentTaskResponse(UserCurrentTask task) {
        return UserCurrentTaskResponse.builder()
                .id(task.getId())
                .userId(task.getUserId())
                .taskId(task.getTaskId())
                .projectId(task.getProjectId())
                .taskTitle(task.getTaskTitle())
                .estimatedHours(task.getEstimatedHours())
                .remainingHours(task.getRemainingHours())
                .actualHoursSpent(task.getActualHoursSpent())
                .progressPercentage(task.getProgressPercentage())
                .priority(task.getPriority())
                .status(task.getStatus())
                .dueDate(task.getDueDate())
                .assignedDate(task.getAssignedDate())
                .build();
    }

    private List<WorkloadOptimizationResponse.WorkloadRebalancingSuggestion> generateOptimizationSuggestions(
            List<UserCurrentTask> projectTasks) {
        List<WorkloadOptimizationResponse.WorkloadRebalancingSuggestion> suggestions = new ArrayList<>();

        // Simple optimization logic - find overloaded users and suggest redistribution
        // This would be more sophisticated in a real implementation

        for (UserCurrentTask task : projectTasks) {
            UserWorkload workload = getOrCreateUserWorkload(task.getUserId());
            if (calculateUtilizationPercentage(workload) > 100) {
                // Find available users
                List<UserWorkload> availableUsers = userWorkloadRepository.findAvailableUsers(50.0);
                if (!availableUsers.isEmpty()) {
                    suggestions.add(WorkloadOptimizationResponse.WorkloadRebalancingSuggestion.builder()
                            .suggestionType("REASSIGN")
                            .fromUserId(task.getUserId())
                            .toUserId(availableUsers.get(0).getUserId())
                            .taskId(task.getTaskId())
                            .reason("Source user is overloaded")
                            .hoursToMove(task.getEstimatedHours())
                            .impactScore(75.0)
                            .build());
                }
            }
        }

        return suggestions;
    }

    private double calculateProjectUtilization(List<UserCurrentTask> projectTasks) {
        if (projectTasks.isEmpty()) return 0.0;

        return projectTasks.stream()
                .mapToDouble(task -> {
                    UserWorkload workload = getOrCreateUserWorkload(task.getUserId());
                    return calculateUtilizationPercentage(workload);
                })
                .average().orElse(0.0);
    }

    private List<String> getDepartmentUserIds(String departmentId) {
        // This would integrate with user/profile service to get department users
        // For now, return mock data
        return List.of("user1", "user2", "user3", "user4");
    }
}
