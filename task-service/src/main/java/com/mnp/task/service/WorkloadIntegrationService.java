package com.mnp.task.service;

import com.mnp.task.client.WorkloadServiceClient;
import com.mnp.task.dto.request.AddTaskToWorkloadRequest;
import com.mnp.task.dto.request.UpdateTaskWorkloadRequest;
import com.mnp.task.entity.Task;
import com.mnp.task.enums.TaskStatus;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WorkloadIntegrationService {

    WorkloadServiceClient workloadServiceClient;

    /**
     * Add task to user's workload when task is assigned
     */
    public void addTaskToWorkload(Task task) {
        if (task.getAssignedTo() == null || task.getAssignedTo().trim().isEmpty()) {
            log.debug("Task {} has no assignee, skipping workload update", task.getId());
            return;
        }

        try {
            AddTaskToWorkloadRequest request = AddTaskToWorkloadRequest.builder()
                    .taskId(task.getId())
                    .projectId(task.getProjectId())
                    .estimatedHours(task.getEstimatedHours() != null ? task.getEstimatedHours() : 0)
                    .priority(task.getPriority() != null ? task.getPriority().toString() : "MEDIUM")
                    .dueDate(task.getDueDate())
                    .taskTitle(task.getTitle())
                    .build();

            workloadServiceClient.addTaskToWorkload(task.getAssignedTo(), request);
            log.info("Added task {} to workload for user {}", task.getId(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to add task {} to workload for user {}: {}",
                     task.getId(), task.getAssignedTo(), e.getMessage());
            // Don't fail task creation if workload service is down
        }
    }

    /**
     * Update task workload when task properties change
     */
    public void updateTaskWorkload(Task task, Integer oldEstimatedHours, Integer oldActualHours, Double oldProgress) {
        if (task.getAssignedTo() == null || task.getAssignedTo().trim().isEmpty()) {
            log.debug("Task {} has no assignee, skipping workload update", task.getId());
            return;
        }

        try {
            UpdateTaskWorkloadRequest request = UpdateTaskWorkloadRequest.builder()
                    .estimatedHours(task.getEstimatedHours())
                    .actualHoursSpent(task.getActualHours())
                    .progressPercentage(task.getProgressPercentage())
                    .build();

            // Calculate remaining hours if we have the data
            if (task.getEstimatedHours() != null && task.getProgressPercentage() != null) {
                int remainingHours = (int) (task.getEstimatedHours() * (1.0 - task.getProgressPercentage() / 100.0));
                request.setRemainingHours(Math.max(0, remainingHours));
            }

            workloadServiceClient.updateTaskWorkload(task.getId(), request);
            log.info("Updated workload for task {} assigned to user {}", task.getId(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to update workload for task {} assigned to user {}: {}",
                     task.getId(), task.getAssignedTo(), e.getMessage());
            // Don't fail task update if workload service is down
        }
    }

    /**
     * Update task status in workload when task status changes
     */
    public void updateTaskStatusInWorkload(Task task, TaskStatus oldStatus, TaskStatus newStatus) {
        if (task.getAssignedTo() == null || task.getAssignedTo().trim().isEmpty()) {
            log.debug("Task {} has no assignee, skipping workload status update", task.getId());
            return;
        }

        try {
            UpdateTaskWorkloadRequest request = UpdateTaskWorkloadRequest.builder()
                    .progressPercentage(getProgressForStatus(newStatus))
                    .build();

            // If task is completed, set actual hours and progress
            if (newStatus == TaskStatus.DONE) {
                request.setProgressPercentage(100.0);
                if (task.getEstimatedHours() != null) {
                    request.setRemainingHours(0);
                }
            } else if (newStatus == TaskStatus.IN_PROGRESS && oldStatus == TaskStatus.TODO) {
                // Task just started, initialize progress if not set
                if (task.getProgressPercentage() == null || task.getProgressPercentage() == 0.0) {
                    request.setProgressPercentage(5.0); // Small initial progress
                }
            }

            workloadServiceClient.updateTaskWorkload(task.getId(), request);
            log.info("Updated workload status for task {} ({}->{})", task.getId(), oldStatus, newStatus);
        } catch (Exception e) {
            log.error("Failed to update workload status for task {}: {}", task.getId(), e.getMessage());
        }
    }

    /**
     * Remove task from workload when task is completed or cancelled
     */
    public void removeTaskFromWorkload(Task task) {
        if (task.getAssignedTo() == null || task.getAssignedTo().trim().isEmpty()) {
            log.debug("Task {} has no assignee, skipping workload removal", task.getId());
            return;
        }

        try {
            workloadServiceClient.removeTaskFromWorkload(task.getId());
            log.info("Removed task {} from workload for user {}", task.getId(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to remove task {} from workload for user {}: {}",
                     task.getId(), task.getAssignedTo(), e.getMessage());
        }
    }

    /**
     * Handle task reassignment - remove from old assignee and add to new assignee
     */
    public void handleTaskReassignment(Task task, String oldAssigneeId, String newAssigneeId) {
        // Remove from old assignee's workload
        if (oldAssigneeId != null && !oldAssigneeId.trim().isEmpty()) {
            try {
                workloadServiceClient.removeTaskFromWorkload(task.getId());
                log.info("Removed task {} from old assignee {} workload", task.getId(), oldAssigneeId);
            } catch (Exception e) {
                log.error("Failed to remove task {} from old assignee {} workload: {}",
                         task.getId(), oldAssigneeId, e.getMessage());
            }
        }

        // Add to new assignee's workload
        if (newAssigneeId != null && !newAssigneeId.trim().isEmpty()) {
            addTaskToWorkload(task);
        }
    }

    private Double getProgressForStatus(TaskStatus status) {
        return switch (status) {
            case TODO -> 0.0;
            case IN_PROGRESS -> null; // Keep existing progress
            case REVIEW -> 90.0;
            case DONE -> 100.0;
            case CANCELLED -> null; // Keep existing progress
        };
    }
}
