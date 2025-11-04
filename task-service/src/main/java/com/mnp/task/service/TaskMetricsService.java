package com.mnp.task.service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;
import org.springframework.stereotype.Service;

import com.mnp.task.entity.Task;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.repository.TaskRepository;

import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskMetricsService {

    TaskRepository taskRepository;

    /**
     * Calculate comprehensive task metrics for a user
     */
    public TaskMetricsResponse calculateUserTaskMetrics(String userId) {
        log.info("Calculating task metrics for user: {}", userId);

        // Get all tasks for the user (both assigned and created)
        List<Task> userTasks = taskRepository.findByAssignedToOrCreatedBy(userId, userId);
        
        if (userTasks.isEmpty()) {
            log.info("No tasks found for user: {}", userId);
            return new TaskMetricsResponse(0, 0, null, null, null, null);
        }

        int totalTasks = userTasks.size();
        int completedTasks = 0;
        int onTimeTasks = 0;
        double totalQualityRating = 0.0;
        int ratedTasks = 0;
        double totalTaskDuration = 0.0;
        int timedTasks = 0;
        double totalEstimatedHours = 0.0;
        double totalActualHours = 0.0;
        int estimatedTasks = 0;

        for (Task task : userTasks) {
            // Count completed tasks
            if (task.getStatus() == TaskStatus.DONE) {
                completedTasks++;

                // Check if completed on time
                if (task.getDueDate() != null && task.getCompletedAt() != null) {
                    if (!task.getCompletedAt().isAfter(task.getDueDate())) {
                        onTimeTasks++;
                    }
                }

                // Calculate task duration
                if (task.getStartedAt() != null && task.getCompletedAt() != null) {
                    long duration = Duration.between(task.getStartedAt(), task.getCompletedAt()).toHours();
                    totalTaskDuration += duration;
                    timedTasks++;
                }
            }

            // Quality rating
            if (task.getQualityRating() != null) {
                totalQualityRating += task.getQualityRating();
                ratedTasks++;
            }

            // Estimated vs Actual hours
            if (task.getEstimatedHours() != null && task.getActualHours() != null) {
                totalEstimatedHours += task.getEstimatedHours();
                totalActualHours += task.getActualHours();
                estimatedTasks++;
            }
        }

        // Calculate averages and rates
        Double averageQualityRating = ratedTasks > 0 ? totalQualityRating / ratedTasks : null;
        Double onTimeCompletionRate = completedTasks > 0 ? (double) onTimeTasks / completedTasks : null;
        Double averageTaskDuration = timedTasks > 0 ? totalTaskDuration / timedTasks : null;
        Double estimatedActualRatio = (estimatedTasks > 0 && totalEstimatedHours > 0) 
                ? totalActualHours / totalEstimatedHours : null;

        TaskMetricsResponse response = new TaskMetricsResponse(
            totalTasks,
            completedTasks,
            averageQualityRating,
            onTimeCompletionRate,
            averageTaskDuration,
            estimatedActualRatio
        );

        log.info("Task metrics calculated for user {}: totalTasks={}, completedTasks={}, avgQuality={}, onTimeRate={}", 
                userId, totalTasks, completedTasks, averageQualityRating, onTimeCompletionRate);

        return response;
    }

    /**
     * Task metrics response DTO
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskMetricsResponse {
        private int totalTasks;
        private int completedTasks;
        private Double averageQualityRating;
        private Double onTimeCompletionRate;
        private Double averageTaskDuration;
        private Double estimatedActualRatio;
    }
}