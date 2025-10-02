package com.mnp.assignment.client;

import com.mnp.assignment.configuration.FeignClientConfiguration;
import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.request.TaskAssignmentNotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${app.services.notification}", configuration = FeignClientConfiguration.class)
public interface NotificationServiceClient {

    @PostMapping("/internal/notifications/send")
    ApiResponse<String> sendTaskAssignmentNotification(@RequestBody TaskAssignmentNotificationRequest request);

    @PostMapping("/internal/notifications/websocket/send")
    ApiResponse<String> sendWebSocketNotification(@RequestBody TaskAssignmentNotificationRequest request);

    @PostMapping("/internal/notifications/email/send")
    ApiResponse<String> sendEmailNotification(@RequestBody TaskAssignmentNotificationRequest request);

    @PostMapping("/internal/notifications/bulk/send")
    ApiResponse<String> sendBulkNotifications(@RequestBody TaskAssignmentNotificationRequest request);
}
