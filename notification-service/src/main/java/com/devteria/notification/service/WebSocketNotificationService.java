package com.devteria.notification.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.devteria.event.dto.NotificationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketNotificationService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserNotificationService userNotificationService;

    public void sendNotificationToUser(String userId, NotificationEvent event) {
        try {
            log.info("Processing WebSocket notification for user: {}", userId);

            // Always persist the notification first
            persistNotification(userId, event);

            // Use principal name for WebSocket delivery
            sendNotificationToUserByPrincipal(userId, event);

        } catch (Exception e) {
            log.error("Failed to process WebSocket notification for user: {}", userId, e);
        }
    }

    public void sendNotificationToAll(NotificationEvent event) {
        try {
            log.info("Broadcasting WebSocket notification to all users");

            // For broadcast notifications, we still persist for each specific user if needed
            // This would require additional logic to determine target users

            // Send real-time broadcast
            messagingTemplate.convertAndSend("/topic/notifications", createNotificationPayload(event));
            log.info("Broadcasted WebSocket notification to all connected users");
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket notification", e);
        }
    }

    // Add a method to send notification to a specific user using Spring's principal name
    public void sendNotificationToUserByPrincipal(String principalName, NotificationEvent event) {
        try {
            log.info("Sending WebSocket notification to principal: {}", principalName);
            messagingTemplate.convertAndSendToUser(
                    principalName, "/queue/notifications", createNotificationPayload(event));
            log.info("Sent real-time WebSocket notification to principal: {}", principalName);
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification to principal: {}", principalName, e);
        }
    }

    private void persistNotification(String userId, NotificationEvent event) {
        try {
            // Use subject/body if present, else fallback to extractTitle/createNotificationMessage
            String title = event.getSubject() != null && !event.getSubject().isBlank()
                    ? event.getSubject()
                    : extractTitle(event);
            String message = event.getBody() != null && !event.getBody().isBlank()
                    ? event.getBody()
                    : createNotificationMessage(event);

            userNotificationService.saveNotification(
                    userId,
                    event.getParam() != null ? (String) event.getParam().get("type") : "SYSTEM",
                    title,
                    message,
                    event.getParam(),
                    event.getChannel(),
                    event.getTemplateCode());

        } catch (Exception e) {
            log.error("Failed to persist notification for user: {}", userId, e);
        }
    }

    private String extractTitle(NotificationEvent event) {
        if (event.getParam() != null) {
            String eventType = (String) event.getParam().get("eventType");
            String scope = (String) event.getParam().get("scope");

            if ("BUSINESS_ROLE_CHANGE".equals(event.getParam().get("type"))) {
                String scopeText = "ALL_COMPANY".equals(scope) ? "Company-wide" : "Department";
                return String.format("%s Role Change", scopeText);
            }
        }
        return "System Notification";
    }

    private Map<String, Object> createNotificationPayload(NotificationEvent event) {
        Map<String, Object> payload = new HashMap<>();

        if (event.getParam() != null) {
            payload.put("type", event.getParam().get("type"));
            payload.put("data", event.getParam());
            payload.put("timestamp", event.getParam().get("timestamp"));
        }

        // Use subject/body if present, else fallback to old logic
        String title =
                event.getSubject() != null && !event.getSubject().isBlank() ? event.getSubject() : extractTitle(event);
        String message = event.getBody() != null && !event.getBody().isBlank()
                ? event.getBody()
                : createNotificationMessage(event);

        payload.put("title", title);
        payload.put("message", message);

        return payload;
    }

    private String createNotificationMessage(NotificationEvent event) {
        if (event.getParam() == null) {
            return "System notification";
        }

        Map<String, Object> params = event.getParam();
        String eventType = (String) params.get("eventType");
        String changedUserName = (String) params.get("changedUserName");
        String newRole = (String) params.get("newRole");

        return switch (eventType != null ? eventType : "UNKNOWN") {
            case "ROLE_ASSIGNED" -> String.format("%s has been assigned as %s", changedUserName, newRole);
            case "ROLE_UPDATED" -> {
                String oldRole = (String) params.get("oldRole");
                yield String.format("%s role has been updated from %s to %s", changedUserName, oldRole, newRole);
            }
            case "ROLE_REMOVED" -> String.format(
                    "%s role as %s has been removed", changedUserName, params.get("oldRole"));
            default -> String.format("Business role change for %s", changedUserName);
        };
    }
}
