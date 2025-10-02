package com.mnp.assignment.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mnp.assignment.client.NotificationServiceClient;
import com.mnp.assignment.client.ProfileServiceClient;
import com.mnp.assignment.dto.request.TaskAssignmentNotificationRequest;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskAssignmentNotificationService {

    NotificationServiceClient notificationServiceClient;
    ProfileServiceClient profileServiceClient;

    public void notifyUserTaskAssigned(String userId, String userName, String taskId, String taskTitle,
                                     String projectName, String assignedBy, String priority, String dueDate) {
        try {
            log.info("Sending task assignment notification to user {} for task: {}", userId, taskTitle);

            // Prepare notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("taskId", taskId);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName != null ? projectName : "Unknown Project");
            params.put("assignedBy", assignedBy != null ? assignedBy : "System");
            params.put("priority", priority != null ? priority : "MEDIUM");
            params.put("dueDate", dueDate);
            params.put("userName", userName);

            // Prepare additional data for mobile/web apps
            Map<String, String> data = new HashMap<>();
            data.put("type", "TASK_ASSIGNED");
            data.put("task_id", taskId);
            data.put("project_name", projectName != null ? projectName : "");
            data.put("priority", priority != null ? priority : "MEDIUM");
            data.put("action", "navigate_to_dashboard");

            // Create the notification request
            TaskAssignmentNotificationRequest notificationRequest = TaskAssignmentNotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(userId)
                    .recipientName(userName)
                    .type("TASK_ASSIGNED")
                    .title("New Task Assigned")
                    .body("You have been assigned a new task: " + taskTitle + ". Please check your dashboard for details.")
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            notificationServiceClient.sendTaskAssignmentNotification(notificationRequest);

            log.info("Task assignment notification sent successfully to user {} for task: {}", userId, taskTitle);

        } catch (Exception e) {
            log.error("Failed to send task assignment notification to user {} for task {}: {}",
                    userId, taskTitle, e.getMessage());
            // Don't throw exception to avoid breaking the main task assignment flow
        }
    }

    public void notifyUserTaskReassigned(String userId, String userName, String taskId, String taskTitle,
                                       String projectName, String reassignedBy, String reason, String priority) {
        try {
            log.info("Sending task reassignment notification to user {} for task: {}", userId, taskTitle);

            // Prepare notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("taskId", taskId);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName != null ? projectName : "Unknown Project");
            params.put("reassignedBy", reassignedBy != null ? reassignedBy : "System");
            params.put("reason", reason);
            params.put("priority", priority != null ? priority : "MEDIUM");
            params.put("userName", userName);

            // Prepare additional data for mobile/web apps
            Map<String, String> data = new HashMap<>();
            data.put("type", "TASK_REASSIGNED");
            data.put("task_id", taskId);
            data.put("project_name", projectName != null ? projectName : "");
            data.put("priority", priority != null ? priority : "MEDIUM");
            data.put("action", "navigate_to_dashboard");

            // Create the notification request
            TaskAssignmentNotificationRequest notificationRequest = TaskAssignmentNotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(userId)
                    .recipientName(userName)
                    .type("TASK_REASSIGNED")
                    .title("Task Reassigned")
                    .body("Task '" + taskTitle + "' has been reassigned to you. Please check your dashboard for details.")
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            notificationServiceClient.sendTaskAssignmentNotification(notificationRequest);

            log.info("Task reassignment notification sent successfully to user {} for task: {}", userId, taskTitle);

        } catch (Exception e) {
            log.error("Failed to send task reassignment notification to user {} for task {}: {}",
                    userId, taskTitle, e.getMessage());
            // Don't throw exception to avoid breaking the main flow
        }
    }

    public void notifyUserTaskDueSoon(String userId, String userName, String taskId, String taskTitle,
                                    String projectName, String dueDate, int hoursUntilDue) {
        try {
            log.info("Sending task due reminder notification to user {} for task: {}", userId, taskTitle);

            // Prepare notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("taskId", taskId);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName != null ? projectName : "Unknown Project");
            params.put("dueDate", dueDate);
            params.put("hoursUntilDue", hoursUntilDue);
            params.put("userName", userName);

            // Prepare additional data for mobile/web apps
            Map<String, String> data = new HashMap<>();
            data.put("type", "TASK_DUE_REMINDER");
            data.put("task_id", taskId);
            data.put("project_name", projectName != null ? projectName : "");
            data.put("hours_until_due", String.valueOf(hoursUntilDue));
            data.put("action", "navigate_to_task");

            String timeText = hoursUntilDue <= 24 ? hoursUntilDue + " hours" : (hoursUntilDue / 24) + " days";

            // Create the notification request
            TaskAssignmentNotificationRequest notificationRequest = TaskAssignmentNotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(userId)
                    .recipientName(userName)
                    .type("TASK_DUE_REMINDER")
                    .title("Task Due Soon")
                    .body("Task '" + taskTitle + "' is due in " + timeText + ". Please check your dashboard.")
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            notificationServiceClient.sendTaskAssignmentNotification(notificationRequest);

            log.info("Task due reminder notification sent successfully to user {} for task: {}", userId, taskTitle);

        } catch (Exception e) {
            log.error("Failed to send task due reminder notification to user {} for task {}: {}",
                    userId, taskTitle, e.getMessage());
        }
    }

    public void notifyUserAboutNewAssignment(String assignmentId, String userId) {
        try {
            log.info("Sending task assignment notification for assignment {} to user {}", assignmentId, userId);

            // Fetch user details from profile service
            String userName = "User"; // Default fallback
            try {
                var userResponse = profileServiceClient.getUserDetails(userId);
                if (userResponse != null && userResponse.getResult() != null) {
                    userName = userResponse.getResult().getUsername();
                }
            } catch (Exception e) {
                log.warn("Failed to fetch user details for user {}: {}", userId, e.getMessage());
            }

            // Note: In a complete implementation, you would also fetch task details from task service
            // For now, we'll create a comprehensive notification with available information
            String taskTitle = "New Task Assignment";
            String projectName = "Project";

            // Prepare comprehensive notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("assignmentId", assignmentId);
            params.put("userId", userId);
            params.put("userName", userName);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName);
            params.put("assignmentType", "NEW_ASSIGNMENT");
            params.put("timestamp", java.time.LocalDateTime.now().toString());

            // Prepare additional data for mobile/web apps with dashboard navigation
            Map<String, String> data = new HashMap<>();
            data.put("type", "TASK_ASSIGNED");
            data.put("assignment_id", assignmentId);
            data.put("user_id", userId);
            data.put("action", "navigate_to_dashboard");
            data.put("screen", "task_dashboard");
            data.put("priority", "MEDIUM");

            // Create the comprehensive notification request
            TaskAssignmentNotificationRequest notificationRequest = TaskAssignmentNotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(userId)
                    .recipientName(userName)
                    .type("TASK_ASSIGNED")
                    .title("🎯 New Task Assigned")
                    .body(String.format("Hello %s! You have been assigned a new task. Please check your dashboard to view the details and get started.", userName))
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .priority("MEDIUM")
                    .persistent(true)
                    .category("TASK_MANAGEMENT")
                    .build();

            // Send WebSocket notification for real-time updates
            notificationServiceClient.sendTaskAssignmentNotification(notificationRequest);

            // Also send a follow-up reminder notification (optional)
            TaskAssignmentNotificationRequest reminderRequest = TaskAssignmentNotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(userId)
                    .recipientName(userName)
                    .type("DASHBOARD_REMINDER")
                    .title("📋 Dashboard Check Reminder")
                    .body("Don't forget to check your dashboard for your new task assignment and project updates.")
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .priority("LOW")
                    .persistent(false)
                    .category("REMINDER")
                    .ttl(3600L) // 1 hour TTL for reminder
                    .build();

            // Send reminder after a short delay (this could be scheduled)
            notificationServiceClient.sendTaskAssignmentNotification(reminderRequest);

            log.info("Task assignment notification and dashboard reminder sent successfully to user {} for assignment: {}", userId, assignmentId);

        } catch (Exception e) {
            log.error("Failed to send task assignment notification to user {} for assignment {}: {}",
                    userId, assignmentId, e.getMessage(), e);
            // Don't throw exception to avoid breaking the main assignment flow
        }
    }
}
