package com.devteria.notification.controller;

import java.util.Map;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.mnp.event.dto.NotificationEvent;
import com.devteria.notification.dto.ApiResponse;
import com.devteria.notification.dto.request.InternalNotificationRequest;
import com.devteria.notification.dto.response.NotificationResponse;
import com.devteria.notification.entity.UserNotification;
import com.devteria.notification.service.UserNotificationService;
import com.devteria.notification.service.WebSocketNotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/internal/notifications")
@RequiredArgsConstructor
@Slf4j
public class InternalNotificationController {

    private final UserNotificationService userNotificationService;
    private final WebSocketNotificationService webSocketNotificationService;

    @PostMapping("/send")
    public ResponseEntity<ApiResponse<NotificationResponse>> sendNotification(
            @Valid @RequestBody InternalNotificationRequest request) {

        log.info(
                "Received internal notification request for user: {}, type: {}",
                request.getUserId(),
                request.getType());

        try {
            // Save notification to database
            UserNotification notification = userNotificationService.saveNotification(
                    request.getUserId(),
                    request.getType(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getData(),
                    request.getChannel(),
                    request.getTemplateCode());

            // Send real-time notification via WebSocket if enabled
            if (request.isRealTime()) {
                NotificationEvent event = createNotificationEvent(request);
                webSocketNotificationService.sendNotificationToUser(request.getUserId(), event);
            }

            NotificationResponse response = NotificationResponse.from(notification);

            log.info(
                    "Successfully sent notification with ID: {} to user: {}",
                    notification.getId(),
                    request.getUserId());

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<NotificationResponse>builder()
                            .code(201)
                            .message("Notification sent successfully")
                            .result(response)
                            .build());

        } catch (Exception e) {
            log.error("Failed to send notification for user: {}", request.getUserId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<NotificationResponse>builder()
                            .code(500)
                            .message("Failed to send notification: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping("/broadcast")
    public ResponseEntity<ApiResponse<String>> broadcastNotification(
            @Valid @RequestBody BroadcastNotificationRequest request) {

        log.info(
                "Received broadcast notification request for {} users",
                request.getUserIds().size());

        try {
            int successCount = 0;
            int failureCount = 0;

            for (String userId : request.getUserIds()) {
                try {
                    UserNotification notification = userNotificationService.saveNotification(
                            userId,
                            request.getType(),
                            request.getTitle(),
                            request.getMessage(),
                            request.getData(),
                            request.getChannel(),
                            request.getTemplateCode());

                    if (request.isRealTime()) {
                        NotificationEvent event = createNotificationEventFromBroadcast(request, userId);
                        webSocketNotificationService.sendNotificationToUser(userId, event);
                    }
                    successCount++;
                } catch (Exception e) {
                    log.warn("Failed to send notification to user: {}", userId, e);
                    failureCount++;
                }
            }

            log.info("Broadcast completed: {} successful, {} failed", successCount, failureCount);

            return ResponseEntity.ok(ApiResponse.<String>builder()
                    .code(200)
                    .message(String.format("Broadcast completed: %d successful, %d failed", successCount, failureCount))
                    .result(String.format("Success: %d, Failed: %d", successCount, failureCount))
                    .build());

        } catch (Exception e) {
            log.error("Failed to broadcast notifications", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<String>builder()
                            .code(500)
                            .message("Failed to broadcast notifications: " + e.getMessage())
                            .build());
        }
    }

    @PostMapping("/template")
    public ResponseEntity<ApiResponse<NotificationResponse>> sendTemplateNotification(
            @Valid @RequestBody TemplateNotificationRequest request) {

        log.info(
                "Received template notification request for user: {}, template: {}",
                request.getUserId(),
                request.getTemplateCode());

        try {
            // Here you would typically use a template service to process the template
            // For now, we'll use the provided title and message
            UserNotification notification = userNotificationService.saveNotification(
                    request.getUserId(),
                    request.getType(),
                    request.getTitle(),
                    request.getMessage(),
                    request.getTemplateData(),
                    request.getChannel(),
                    request.getTemplateCode());

            if (request.isRealTime()) {
                NotificationEvent event = createNotificationEventFromTemplate(request);
                webSocketNotificationService.sendNotificationToUser(request.getUserId(), event);
            }

            NotificationResponse response = NotificationResponse.from(notification);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.<NotificationResponse>builder()
                            .code(201)
                            .message("Template notification sent successfully")
                            .result(response)
                            .build());

        } catch (Exception e) {
            log.error("Failed to send template notification for user: {}", request.getUserId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.<NotificationResponse>builder()
                            .code(500)
                            .message("Failed to send template notification: " + e.getMessage())
                            .build());
        }
    }

    // Health check endpoint for internal services
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.<String>builder()
                .code(200)
                .message("Notification service is healthy")
                .result("OK")
                .build());
    }

    // Helper methods to create NotificationEvent objects
    private NotificationEvent createNotificationEvent(InternalNotificationRequest request) {
        return NotificationEvent.builder()
                .channel(request.getChannel())
                .recipient(request.getUserId())
                .templateCode(request.getTemplateCode())
                .param(request.getData())
                .subject(request.getTitle())
                .body(request.getMessage())
                .contentType("text/plain")
                .build();
    }

    private NotificationEvent createNotificationEventFromBroadcast(
            BroadcastNotificationRequest request, String userId) {
        return NotificationEvent.builder()
                .channel(request.getChannel())
                .recipient(userId)
                .templateCode(request.getTemplateCode())
                .param(request.getData())
                .subject(request.getTitle())
                .body(request.getMessage())
                .contentType("text/plain")
                .build();
    }

    private NotificationEvent createNotificationEventFromTemplate(TemplateNotificationRequest request) {
        return NotificationEvent.builder()
                .channel(request.getChannel())
                .recipient(request.getUserId())
                .templateCode(request.getTemplateCode())
                .param(request.getTemplateData())
                .subject(request.getTitle())
                .body(request.getMessage())
                .contentType("text/plain")
                .build();
    }

    // Internal DTOs
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class BroadcastNotificationRequest {
        private java.util.List<String> userIds;
        private String type;
        private String title;
        private String message;
        private Map<String, Object> data;
        private String channel;
        private String templateCode;
        private boolean realTime = true;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    @lombok.Builder
    public static class TemplateNotificationRequest {
        private String userId;
        private String type;
        private String templateCode;
        private String title;
        private String message;
        private Map<String, Object> templateData;
        private String channel;
        private boolean realTime = true;
    }
}
