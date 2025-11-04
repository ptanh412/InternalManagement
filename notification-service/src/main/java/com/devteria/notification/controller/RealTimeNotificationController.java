package com.devteria.notification.controller;

import com.devteria.notification.service.SocketIONotificationService;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications/realtime")
@RequiredArgsConstructor
@Slf4j
public class RealTimeNotificationController {

    private final SocketIONotificationService socketIONotificationService;

    /**
     * Endpoint for task assignment notifications
     */
    @PostMapping("/task-assignment")
    public ResponseEntity<String> sendTaskAssignmentNotification(@RequestBody TaskAssignmentNotificationRequest request) {
        try {
            socketIONotificationService.sendTaskAssignmentNotification(
                request.getEmployeeId(),
                request.getTaskId(),
                request.getTaskTitle(),
                request.getProjectName(),
                request.getAssignedBy(),
                request.getDueDate()
            );
            return ResponseEntity.ok("Task assignment notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send task assignment notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    @PostMapping("/task-transfer")
    public ResponseEntity<String> sendTaskAssignmentTransferNotification(@RequestBody TaskTransferNotificationRequest request) {
        try {
            socketIONotificationService.sendTaskAssignmentTransferNotification(
                    request.getEmployeeId(),
                    request.getTaskTitle(),
                    request.getProjectName(),
                    request.getNewAssignedBy(),
                    request.getOldAssignedBy(),
                    request.getDueDate()
            );
            return ResponseEntity.ok("Task assignment notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send task assignment notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    @PostMapping("/submit-task")
    public ResponseEntity<String> sendTaskSubmissionNotification(@RequestBody TaskAssignmentNotificationRequest request) {
        try{
            socketIONotificationService.sendTaskSubmissionNotification(
                request.getEmployeeId(),
                request.getTaskId(),
                request.getTaskTitle(),
                request.getProjectName(),
                request.getAssignedBy(),
                request.getDueDate()
            );
            return ResponseEntity.ok("Task submission notification sent successfully");
        }catch (Exception e) {
            log.error("Failed to send task submission notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }
    @PostMapping("/review-task")
    public ResponseEntity<String> sendTaskReviewNotification(@RequestBody TaskReviewNotificationRequest request) {
        try{
            socketIONotificationService.sendTaskReviewNotification(
                    request.getEmployeeId(),
                    request.getTaskId(),
                    request.getTaskTitle(),
                    request.getProjectName(),
                    request.getReviewedBy(),
                    request.getReviewStatus(),
                    request.getComments(),
                    request.getNewTaskStatus()
            );
            return ResponseEntity.ok("Task review notification sent successfully");
        }catch (Exception e) {
            log.error("Failed to send task review notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Endpoint for project creation notifications
     */
    @PostMapping("/project-creation")
    public ResponseEntity<String> sendProjectCreationNotification(@RequestBody ProjectCreationNotificationRequest request) {
        try {
            socketIONotificationService.sendProjectCreationNotification(
                request.getTeamLeadId(),
                request.getProjectId(),
                request.getProjectName(),
                request.getCreatedBy(),
                request.getDescription()
            );
            return ResponseEntity.ok("Project creation notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send project creation notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Endpoint for employee report notifications
     */
    @PostMapping("/employee-report")
    public ResponseEntity<String> sendEmployeeReportNotification(@RequestBody EmployeeReportNotificationRequest request) {
        try {
            socketIONotificationService.sendEmployeeReportNotification(
                request.getManagerId(),
                request.getEmployeeId(),
                request.getEmployeeName(),
                request.getReportType(),
                request.getReportId(),
                request.getContent()
            );
            return ResponseEntity.ok("Employee report notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send employee report notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Endpoint for group chat addition notifications
     */
    @PostMapping("/group-chat-addition")
    public ResponseEntity<String> sendGroupChatAdditionNotification(@RequestBody GroupChatAdditionNotificationRequest request) {
        try {
            socketIONotificationService.sendGroupChatAdditionNotification(
                request.getEmployeeId(),
                request.getProjectId(),
                request.getProjectName(),
                request.getAddedBy(),
                request.getChatGroupName()
            );
            return ResponseEntity.ok("Group chat addition notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send group chat addition notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Endpoint for custom notifications
     */
    @PostMapping("/custom")
    public ResponseEntity<String> sendCustomNotification(@RequestBody CustomNotificationRequest request) {
        try {
            socketIONotificationService.sendCustomNotification(
                request.getUserId(),
                request.getType(),
                request.getTitle(),
                request.getMessage(),
                request.getAdditionalData()
            );
            return ResponseEntity.ok("Custom notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send custom notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Endpoint for broadcast notifications
     */
    @PostMapping("/broadcast")
    public ResponseEntity<String> sendBroadcastNotification(@RequestBody BroadcastNotificationRequest request) {
        try {
            socketIONotificationService.sendBroadcastNotification(
                request.getType(),
                request.getData()
            );
            return ResponseEntity.ok("Broadcast notification sent successfully");
        } catch (Exception e) {
            log.error("Failed to send broadcast notification", e);
            return ResponseEntity.internalServerError().body("Failed to send notification");
        }
    }

    /**
     * Get system status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getNotificationSystemStatus() {
        try {
            Map<String, Object> status = Map.of(
                "connectedUsers", socketIONotificationService.getConnectedUsersCount(),
                "status", "ACTIVE",
                "timestamp", System.currentTimeMillis()
            );
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Failed to get notification system status", e);
            return ResponseEntity.internalServerError().body(Map.of("status", "ERROR"));
        }
    }

    /**
     * Check if user is online
     */
    @GetMapping("/user/{userId}/online")
    public ResponseEntity<Map<String, Object>> isUserOnline(@PathVariable String userId) {
        try {
            boolean isOnline = socketIONotificationService.isUserOnline(userId);
            Map<String, Object> response = Map.of(
                "userId", userId,
                "isOnline", isOnline,
                "timestamp", System.currentTimeMillis()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to check user online status", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to check status"));
        }
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class TaskAssignmentNotificationRequest {
        private String employeeId;
        private String taskId;
        private String taskTitle;
        private String projectName;
        private String assignedBy;
        private String dueDate;
        private String newTaskStatus;
        private String message;
    }

    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    class TaskTransferNotificationRequest {
        private String employeeId;
        private String taskTitle;
        private String projectName;
        private String newAssignedBy;
        private String oldAssignedBy;
        private String dueDate;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class TaskReviewNotificationRequest {
        private String employeeId;
        private String taskId;
        private String taskTitle;
        private String projectName;
        private String reviewedBy;
        private String reviewStatus;
        private String comments;
        private String newTaskStatus;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class ProjectCreationNotificationRequest {
        private String teamLeadId;
        private String projectId;
        private String projectName;
        private String createdBy;
        private String description;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class EmployeeReportNotificationRequest {
        private String managerId;
        private String employeeId;
        private String employeeName;
        private String reportType;
        private String reportId;
        private String content;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class GroupChatAdditionNotificationRequest {
        private String employeeId;
        private String projectId;
        private String projectName;
        private String addedBy;
        private String chatGroupName;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    public static class CustomNotificationRequest {
        private String userId;
        private String type;
        private String title;
        private String message;
        private Map<String, Object> additionalData;
    }

    public static class BroadcastNotificationRequest {
        private String type;
        private Map<String, Object> data;

        // Getters and setters
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public Map<String, Object> getData() { return data; }
        public void setData(Map<String, Object> data) { this.data = data; }
    }
}
