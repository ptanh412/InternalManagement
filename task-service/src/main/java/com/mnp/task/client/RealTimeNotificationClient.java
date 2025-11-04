package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import lombok.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@FeignClient(name = "notification-service", url = "${app.services.notification}", configuration = FeignClientConfiguration.class)
public interface RealTimeNotificationClient {

    @PostMapping("/api/notifications/realtime/task-assignment")
    void sendTaskAssignmentNotification(@RequestBody TaskAssignmentNotificationRequest request);

    @PostMapping("/api/notifications/realtime/task-transfer")
    void sendTaskTransferNotification(@RequestBody TaskTransferNotificationRequest request);

    @PostMapping("/api/notifications/realtime/group-chat-addition")
    void sendGroupChatAdditionNotification(@RequestBody GroupChatAdditionNotificationRequest request);

    @PostMapping("/api/notifications/realtime/custom")
    void sendCustomNotification(@RequestBody CustomNotificationRequest request);

    @PostMapping("/api/notifications/realtime/submit-task")
    void sendSubmitTaskNotificationToTeamLead(@RequestBody TaskAssignmentNotificationRequest request);

    @PostMapping("/api/notifications/realtime/review-task")
    void sendTaskReviewNotification(@RequestBody TaskReviewNotificationRequest request);

    // DTO Classes
    @Setter
    @Getter
    @NoArgsConstructor  // Thêm annotation này
    @AllArgsConstructor
    class TaskAssignmentNotificationRequest {
        private String employeeId;
        private String taskId;
        private String taskTitle;
        private String projectName;
        private String assignedBy;
        private String dueDate;
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
    class TaskReviewNotificationRequest{
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
    class GroupChatAdditionNotificationRequest {
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
    class CustomNotificationRequest {
        private String userId;
        private String type;
        private String title;
        private String message;
        private Map<String, Object> additionalData;
    }
}
