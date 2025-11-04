package com.mnp.task.service;

import com.corundumstudio.socketio.SocketIOServer;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskSocketIOService implements ApplicationRunner {

    private final SocketIOServer server;

    @Override
    public void run(ApplicationArguments args) {
        server.start();
        log.info("Task-service SocketIO server started successfully on port: {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            log.info("Task-service SocketIO server stopped");
        }
    }

    /**
     * Send task assignment notification to the assigned user
     */
    public void notifyTaskAssigned(TaskResponse task, String projectName, String teamLeadName ) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_ASSIGNED");
            notification.put("message", "You have been assigned a new task: " + task.getTitle());
            notification.put("task", task);
            notification.put("projectName", projectName);
            notification.put("teamLeadName", teamLeadName);
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("assignedTo", task.getAssignedTo());

            // Send to all connected clients (the assigned user will filter based on their ID)
            server.getBroadcastOperations().sendEvent("task-assigned", notification);

            log.info("Sent task assignment notification for task: {} to user: {}",
                    task.getTitle(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to send task assignment notification for task: {}",
                    task.getTitle(), e);
        }
    }

    public void notifyAddedToChatProject(String projectId, String userId) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "ADDED_TO_CHAT_PROJECT");
            notification.put("projectId", projectId);
            notification.put("userId", userId);
            notification.put("timestamp", System.currentTimeMillis());
            server.getBroadcastOperations().sendEvent("added-to-chat-project", notification);
            log.info("Sent added to chat project notification for project: {} to user: {}",
                    projectId, userId);
        }catch (Exception e) {
            log.error("Failed to send added to chat project notification for project: {}",
                    projectId, e);
        }
    }
    /**
     * Send task status update notification
     */
    public void notifyTaskStatusChanged(TaskResponse task) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_STATUS_CHANGED");
            notification.put("message", "Task status changed to " + task.getStatus() + ": " + task.getTitle());
            notification.put("task", task);
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("assignedTo", task.getAssignedTo());

            server.getBroadcastOperations().sendEvent("task-status-changed", notification);

            log.info("Sent task status change notification for task: {} to user: {}",
                    task.getTitle(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to send task status change notification for task: {}",
                    task.getTitle(), e);
        }
    }

    /**
     * Send task update notification
     */
    public void notifyTaskUpdated(TaskResponse task) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_UPDATED");
            notification.put("message", "Task has been updated: " + task.getTitle());
            notification.put("task", task);
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("assignedTo", task.getAssignedTo());

            server.getBroadcastOperations().sendEvent("task-updated", notification);

            log.info("Sent task update notification for task: {} to user: {}",
                    task.getTitle(), task.getAssignedTo());
        } catch (Exception e) {
            log.error("Failed to send task update notification for task: {}",
                    task.getTitle(), e);
        }
    }

    /**
     * Send task transfer notification to the previous assignee
     */
    public void notifyTaskTransferred(String previousAssigneeId, String newAssigneeName, TaskResponse task)  {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_TRANSFERRED");
            notification.put("message", "Task '" + task.getTitle() + "' has been transferred to " + newAssigneeName);
            notification.put("task", task);
            notification.put("taskTitle", task.getTitle());
            notification.put("newAssigneeName", newAssigneeName);
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("previousAssigneeId", previousAssigneeId);

            server.getBroadcastOperations().sendEvent("task-transferred", notification);

            log.info("Sent task transfer notification for task: {} to previous assignee: {}",
                    task.getTitle(), previousAssigneeId);
        } catch (Exception e) {
            log.error("Failed to send task transfer notification for task: {}",
                    task.getTitle(), e);
        }
    }

    public void notifyStatusTaskAfterReviewToSubmitBy(String status, TaskSubmissionResponse submission, String taskName)  {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TASK_STATUS_UPDATE");
            notification.put("message", "Task '" + taskName + "' has been review and update status to " + status);
            notification.put("submission", submission);
            notification.put("statusTask", status);
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("review", submission.getReviewComments());

            server.getBroadcastOperations().sendEvent("task-status-update", notification);
            log.info("Sent task status update notification for task submission to user: {}",
                    submission.getSubmittedBy());
        } catch (Exception e) {
            log.error("Failed to send task status update notification for task: {}", e.getMessage(), e);
        }
    }

    /**
     * Send custom notification to specific user or all clients
     */
    public void sendNotification(String event, Object data, String room) {
        try {
            if (room != null && !room.isEmpty()) {
                server.getRoomOperations(room).sendEvent(event, data);
                log.info("Sent notification to room {}: {}", room, event);
            } else {
                server.getBroadcastOperations().sendEvent(event, data);
                log.info("Sent broadcast notification: {}", event);
            }
        } catch (Exception e) {
            log.error("Failed to send notification: {}", event, e);
        }
    }

    public void notifySubmissionUpdated(TaskSubmissionResponse submission, String taskName, String action) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "SUBMISSION_UPDATED");
            notification.put("message", "Task submission '" + taskName + "' has been " + action + " by employee");
            notification.put("submission", submission);
            notification.put("taskName", taskName);
            notification.put("action", action);
            notification.put("timestamp", System.currentTimeMillis());

            server.getBroadcastOperations().sendEvent("submission-updated", notification);
            log.info("Sent submission {} notification for task: {}", action, taskName);
        } catch (Exception e) {
            log.error("Failed to send submission {} notification for task: {}", action, taskName, e);
        }
    }
}
