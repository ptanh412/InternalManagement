package com.devteria.notification.service;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.devteria.notification.dto.response.NotificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class SocketIONotificationService {

    private final SocketIOServer socketIOServer;
    private final UserNotificationService userNotificationService;

    // Store user sessions for targeted notifications
    private final Map<String, SocketIOClient> userSessions = new ConcurrentHashMap<>();

    @PostConstruct
    public void startServer() {
        socketIOServer.start();
        log.info("Socket.IO server started on port: {}", socketIOServer.getConfiguration().getPort());
        setupEventHandlers();
    }

    @PreDestroy
    public void stopServer() {
        socketIOServer.stop();
        log.info("Socket.IO server stopped");
    }

    private void setupEventHandlers() {
        // Handle client connections
        socketIOServer.addConnectListener(client -> {
            String userId = client.getHandshakeData().getSingleUrlParam("userId");
            if (userId != null) {
                userSessions.put(userId, client);
                log.info("User {} connected with session {}", userId, client.getSessionId());

                // Send any pending notifications
                sendPendingNotifications(userId, client);
            }
        });

        // Handle client disconnections
        socketIOServer.addDisconnectListener(client -> {
            String userId = getUserIdFromClient(client);
            if (userId != null) {
                userSessions.remove(userId);
                log.info("User {} disconnected", userId);
            }
        });
    }

    /**
     * Send task assignment notification to employee
     */
    public void sendTaskAssignmentNotification(String employeeId, String taskId, String taskTitle,
                                             String projectName, String assignedBy, String dueDate) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_ASSIGNMENT");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("assignedBy", assignedBy);
            notificationData.put("dueDate", dueDate);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "New Task Assigned");
            notificationData.put("message", String.format("You have been assigned a new task: '%s' in project '%s'", taskTitle, projectName));
            notificationData.put("actionUrl", "/tasks/" + taskId);
            notificationData.put("priority", "HIGH");

            // Send real-time notification
            sendNotificationToUser(employeeId, notificationData);

            // Persist notification
            persistNotification(employeeId, "TASK_ASSIGNMENT", notificationData);

            log.info("Task assignment notification sent to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send task assignment notification to employee: {}", employeeId, e);
        }
    }

    public void sendTaskAssignmentTransferNotification(String employeeId,String taskTitle,
                                               String projectName, String newAssignBy, String oldAssignBy, String dueDate) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_TRANSFER");
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("newAssignBy", newAssignBy);
            notificationData.put("dueDate", dueDate);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Task Transferred");
            notificationData.put("message", String.format("'%s' has been assigned for: '%s' in project '%s'", taskTitle,newAssignBy, projectName));
            notificationData.put("priority", "HIGH");

            // Send real-time notification
            sendNotificationToUser(employeeId, notificationData);

            // Persist notification
            persistNotification(employeeId, "TASK_TRANSFER", notificationData);

            log.info("Task assignment notification sent to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send task assignment notification to employee: {}", employeeId, e);
        }
    }
    public void sendTaskSubmissionNotification(String employeeId, String taskId, String taskTitle,String projectName,
                                                String assignedBy, String dueDate){
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_SUBMISSION");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("assignedBy", assignedBy);
            notificationData.put("dueDate", dueDate);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Task Submitted");
            notificationData.put("message", String.format("The task: '%s' has been submitted", taskTitle));

            sendNotificationToUser(employeeId, notificationData);
            persistNotification(employeeId, "TASK_SUBMISSION", notificationData);
            log.info("Task submission notification sent to employee: {}", assignedBy);
        }catch (Exception e){
            log.error("Failed to send task submission notification to employee: {}", assignedBy, e);
        }
    }

    public void sendTaskReviewNotification(String employeeId, String taskId, String taskTitle,
                                           String projectName, String reviewedBy, String reviewStatus,
                                           String comments, String newTaskStatus) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_REVIEW");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("reviewedBy", reviewedBy);
            notificationData.put("reviewStatus", reviewStatus);
            notificationData.put("comments", comments);
            notificationData.put("newTaskStatus", newTaskStatus);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Task Reviewed");

            sendNotificationToUser(employeeId, notificationData);
            persistNotification(employeeId, "TASK_REVIEW", notificationData);
            log.info("Task review notification sent to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send task review notification to employee: {}", employeeId, e);
        }
    }
    /**
     * Send project creation notification to team lead
     */
    public void sendProjectCreationNotification(String teamLeadId, String projectId, String projectName,
                                               String createdBy, String description) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "PROJECT_CREATION");
            notificationData.put("projectId", projectId);
            notificationData.put("projectName", projectName);
            notificationData.put("createdBy", createdBy);
            notificationData.put("description", description != null ? description : "");
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "New Project Created");
            notificationData.put("message", String.format("You have been assigned as team lead for project: '%s'", projectName));
            notificationData.put("actionUrl", "/projects/" + projectId);
            notificationData.put("priority", "HIGH");

            // Send real-time notification
            sendNotificationToUser(teamLeadId, notificationData);

            // Persist notification
            persistNotification(teamLeadId, "PROJECT_CREATION", notificationData);

            log.info("Project creation notification sent to team lead: {}", teamLeadId);
        } catch (Exception e) {
            log.error("Failed to send project creation notification to team lead: {}", teamLeadId, e);
        }
    }

    /**
     * Send employee report notification to managers/team leads
     */
    public void sendEmployeeReportNotification(String managerId, String employeeId, String employeeName,
                                             String reportType, String reportId, String content) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "EMPLOYEE_REPORT");
            notificationData.put("employeeId", employeeId);
            notificationData.put("employeeName", employeeName);
            notificationData.put("reportType", reportType);
            notificationData.put("reportId", reportId);
            notificationData.put("content", content);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Employee Report Submitted");
            notificationData.put("message", String.format("%s has submitted a %s report", employeeName, reportType.toLowerCase()));
            notificationData.put("actionUrl", "/reports/" + reportId);
            notificationData.put("priority", "MEDIUM");

            // Send real-time notification
            sendNotificationToUser(managerId, notificationData);

            // Persist notification
            persistNotification(managerId, "EMPLOYEE_REPORT", notificationData);

            log.info("Employee report notification sent to manager: {}", managerId);
        } catch (Exception e) {
            log.error("Failed to send employee report notification to manager: {}", managerId, e);
        }
    }

    /**
     * Send group chat addition notification to employee
     */
    public void sendGroupChatAdditionNotification(String employeeId, String projectId, String projectName,
                                                 String addedBy, String chatGroupName) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "GROUP_CHAT_ADDITION");
            notificationData.put("projectId", projectId);
            notificationData.put("projectName", projectName);
            notificationData.put("addedBy", addedBy);
            notificationData.put("chatGroupName", chatGroupName);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Added to Project Chat");
            notificationData.put("message", String.format("You have been added to the chat group for project '%s'", projectName));
            notificationData.put("actionUrl", "/chat/project/" + projectId);
            notificationData.put("priority", "LOW");

            // Send real-time notification
            sendNotificationToUser(employeeId, notificationData);

            // Persist notification
            persistNotification(employeeId, "GROUP_CHAT_ADDITION", notificationData);

            log.info("Group chat addition notification sent to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send group chat addition notification to employee: {}", employeeId, e);
        }
    }

    /**
     * Send notification to multiple users (broadcast)
     */
    public void sendBroadcastNotification(String notificationType, Map<String, Object> notificationData) {
        try {
            // Add common fields
            Map<String, Object> enrichedData = new HashMap<>(notificationData);
            enrichedData.put("type", notificationType);
            enrichedData.put("timestamp", LocalDateTime.now());

            // Broadcast to all connected users
            socketIOServer.getBroadcastOperations().sendEvent("notification", enrichedData);

            log.info("Broadcast notification sent: {}", notificationType);
        } catch (Exception e) {
            log.error("Failed to send broadcast notification: {}", notificationType, e);
        }
    }

    /**
     * Send notification to specific user
     */
    private void sendNotificationToUser(String userId, Map<String, Object> notificationData) {
        SocketIOClient client = userSessions.get(userId);
        if (client != null && client.isChannelOpen()) {
            client.sendEvent("notification", notificationData);
            log.info("Real-time notification sent to user: {}", userId);
        } else {
            log.warn("User {} is not connected, notification will be stored for later delivery", userId);
        }
    }

    /**
     * Send pending notifications when user connects
     */
    private void sendPendingNotifications(String userId, SocketIOClient client) {
        try {
            // Get unread notifications from database
            var pendingNotifications = userNotificationService.getUnreadNotifications(userId);

            for (NotificationResponse notification : pendingNotifications) {
                Map<String, Object> notificationData = new HashMap<>();
                notificationData.put("type", notification.getType());
                notificationData.put("title", notification.getTitle());
                notificationData.put("message", notification.getMessage());
                notificationData.put("timestamp", notification.getCreatedAt());
                notificationData.put("notificationId", notification.getId());
                notificationData.put("isRead", notification.getIsRead()); // Fixed method name

                client.sendEvent("pending_notification", notificationData);
            }

            log.info("Sent {} pending notifications to user: {}", pendingNotifications.size(), userId);
        } catch (Exception e) {
            log.error("Failed to send pending notifications to user: {}", userId, e);
        }
    }

    /**
     * Persist notification to database
     */
    private void persistNotification(String userId, String type, Map<String, Object> notificationData) {
        try {
            String title = (String) notificationData.get("title");
            String message = Optional.ofNullable((String) notificationData.get("message"))
                    .filter(s -> !s.isEmpty())
                    .orElse((String) notificationData.get("comments"));

            userNotificationService.saveNotification(
                userId,
                type,
                title,
                message,
                notificationData,
                "WEBSOCKET",
                type
            );

            log.debug("Notification persisted for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to persist notification for user: {}", userId, e);
        }
    }

    /**
     * Get user ID from client session
     */
    private String getUserIdFromClient(SocketIOClient client) {
        return userSessions.entrySet().stream()
            .filter(entry -> entry.getValue().getSessionId().equals(client.getSessionId()))
            .map(Map.Entry::getKey)
            .findFirst()
            .orElse(null);
    }

    /**
     * Get connected users count
     */
    public int getConnectedUsersCount() {
        return userSessions.size();
    }

    /**
     * Check if user is online
     */
    public boolean isUserOnline(String userId) {
        SocketIOClient client = userSessions.get(userId);
        return client != null && client.isChannelOpen();
    }

    /**
     * Send custom notification
     */
    public void sendCustomNotification(String userId, String type, String title, String message,
                                     Map<String, Object> additionalData) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", type);
            notificationData.put("title", title);
            notificationData.put("message", message);
            notificationData.put("timestamp", LocalDateTime.now());

            if (additionalData != null) {
                notificationData.putAll(additionalData);
            }

            sendNotificationToUser(userId, notificationData);
            persistNotification(userId, type, notificationData);

            log.info("Custom notification sent to user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send custom notification to user: {}", userId, e);
        }
    }

    /**
     * Send department post notification to multiple employees
     */
    public void sendDepartmentPostNotification(java.util.List<String> employeeIds, String postId, 
                                              String departmentId, String departmentName,
                                              String authorName, String postContent) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "DEPARTMENT_POST");
            notificationData.put("postId", postId);
            notificationData.put("departmentId", departmentId);
            notificationData.put("departmentName", departmentName);
            notificationData.put("authorName", authorName);
            notificationData.put("postContent", postContent);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "New Department Post");
            notificationData.put("message", String.format("%s posted in %s", authorName, departmentName));
            notificationData.put("actionUrl", "/posts/" + postId);
            notificationData.put("priority", "LOW");

            // Send to all employees in the list
            for (String employeeId : employeeIds) {
                sendNotificationToUser(employeeId, notificationData);
                persistNotification(employeeId, "DEPARTMENT_POST", notificationData);
            }

            log.info("Department post notification sent to {} employees in department: {}", 
                    employeeIds.size(), departmentName);
        } catch (Exception e) {
            log.error("Failed to send department post notification", e);
        }
    }

    /**
     * Send task extension request notification to team lead
     */
    public void sendTaskExtensionRequestNotification(String teamLeadId, String taskId, String taskTitle,
                                                    String projectName, String requestedBy, 
                                                    String requestedByName, Integer extensionHours,
                                                    String newDueDate, String reason) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_EXTENSION_REQUEST");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("requestedBy", requestedBy);
            notificationData.put("requestedByName", requestedByName);
            notificationData.put("extensionHours", extensionHours);
            notificationData.put("newDueDate", newDueDate);
            notificationData.put("reason", reason);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Task Extension Request");
            notificationData.put("message", String.format("%s requested %d hours extension for task '%s'", 
                    requestedByName, extensionHours, taskTitle));
            notificationData.put("actionUrl", "/tasks/" + taskId + "/extensions");
            notificationData.put("priority", "HIGH");

            // Send real-time notification
            sendNotificationToUser(teamLeadId, notificationData);

            // Persist notification
            persistNotification(teamLeadId, "TASK_EXTENSION_REQUEST", notificationData);

            log.info("Task extension request notification sent to team lead: {}", teamLeadId);
        } catch (Exception e) {
            log.error("Failed to send task extension request notification to team lead: {}", teamLeadId, e);
        }
    }

    /**
     * Send task extension review notification to employee
     */
    public void sendTaskExtensionReviewNotification(String employeeId, String taskId, String taskTitle,
                                                   String projectName, String reviewedBy,
                                                   String reviewedByName, String status,
                                                   String reviewComments, String newDueDate) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "TASK_EXTENSION_REVIEW");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("reviewedBy", reviewedBy);
            notificationData.put("reviewedByName", reviewedByName);
            notificationData.put("status", status);
            notificationData.put("reviewComments", reviewComments);
            notificationData.put("newDueDate", newDueDate);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Extension Request " + status);
            
            String message = status.equals("APPROVED") 
                    ? String.format("Your extension request for '%s' has been approved. New deadline: %s", 
                            taskTitle, newDueDate)
                    : String.format("Your extension request for '%s' has been rejected", taskTitle);
            
            notificationData.put("message", message);
            notificationData.put("actionUrl", "/tasks/" + taskId);
            notificationData.put("priority", "HIGH");

            // Send real-time notification
            sendNotificationToUser(employeeId, notificationData);

            // Persist notification
            persistNotification(employeeId, "TASK_EXTENSION_REVIEW", notificationData);

            log.info("Task extension review notification sent to employee: {}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send task extension review notification to employee: {}", employeeId, e);
        }
    }

    /**
     * Send deadline reminder notification
     */
    public void sendDeadlineReminderNotification(String employeeId, String taskId, String taskTitle,
                                                String projectName, String dueDate, String reminderType) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "DEADLINE_REMINDER");
            notificationData.put("taskId", taskId);
            notificationData.put("taskTitle", taskTitle);
            notificationData.put("projectName", projectName);
            notificationData.put("dueDate", dueDate);
            notificationData.put("reminderType", reminderType);
            notificationData.put("timestamp", LocalDateTime.now());
            
            String title, message, priority;
            
            switch (reminderType) {
                case "3_DAYS":
                    title = "Task Due Soon";
                    message = String.format("Task '%s' in project '%s' is due in 3 days (%s)", 
                            taskTitle, projectName, dueDate);
                    priority = "MEDIUM";
                    break;
                case "1_DAY":
                    title = "Task Due Tomorrow";
                    message = String.format("⚠️ Task '%s' in project '%s' is due tomorrow (%s)", 
                            taskTitle, projectName, dueDate);
                    priority = "HIGH";
                    break;
                case "OVERDUE":
                    title = "Task Overdue";
                    message = String.format("🚨 Task '%s' in project '%s' is now overdue! Due date was: %s", 
                            taskTitle, projectName, dueDate);
                    priority = "URGENT";
                    break;
                default:
                    title = "Task Deadline Reminder";
                    message = String.format("Reminder: Task '%s' is due on %s", taskTitle, dueDate);
                    priority = "MEDIUM";
            }
            
            notificationData.put("title", title);
            notificationData.put("message", message);
            notificationData.put("actionUrl", "/tasks/" + taskId);
            notificationData.put("priority", priority);

            // Send real-time notification
            sendNotificationToUser(employeeId, notificationData);

            // Persist notification
            persistNotification(employeeId, "DEADLINE_REMINDER", notificationData);

            log.info("Deadline reminder ({}) sent to employee: {} for task: {}", reminderType, employeeId, taskTitle);
        } catch (Exception e) {
            log.error("Failed to send deadline reminder notification to employee: {}", employeeId, e);
        }
    }

    /**
     * Send project update notification to all project members
     */
    public void sendProjectUpdateNotification(List<String> memberIds, String projectId, String projectName,
                                              String updatedBy, String updatedByName, String updateDetails) {
        try {
            Map<String, Object> notificationData = new HashMap<>();
            notificationData.put("type", "PROJECT_UPDATE");
            notificationData.put("projectId", projectId);
            notificationData.put("projectName", projectName);
            notificationData.put("updatedBy", updatedBy);
            notificationData.put("updatedByName", updatedByName);
            notificationData.put("updateDetails", updateDetails);
            notificationData.put("timestamp", LocalDateTime.now());
            notificationData.put("title", "Project Updated");
            String formattedMessage = String.format("%s updated %s: '%s'",
                    updatedByName, updateDetails, projectName);

            notificationData.put("message", formattedMessage);
            notificationData.put("actionUrl", "/projects/" + projectId);
            notificationData.put("priority", "MEDIUM");

            // Send real-time notification to all members
            for (String memberId : memberIds) {
                // Don't send notification to the person who made the update
                if (!memberId.equals(updatedBy)) {
                    sendNotificationToUser(memberId, notificationData);
                    persistNotification(memberId, "PROJECT_UPDATE", notificationData);
                }
            }

            log.info("Project update notification sent to {} members for project: {}", 
                    memberIds.size() - 1, projectName);
        } catch (Exception e) {
            log.error("Failed to send project update notifications for project: {}", projectName, e);
        }
    }
}
