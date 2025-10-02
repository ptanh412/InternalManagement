package com.devteria.notification.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.devteria.event.dto.NotificationEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final EmailService emailService;
    private final WebSocketNotificationService webSocketNotificationService;

    @KafkaListener(topics = "notification-delivery")
    public void handleEmailNotification(NotificationEvent event) {
        try {
            log.info("Received email notification event for: {}", event.getRecipient());

            if ("EMAIL".equals(event.getChannel())) {
                // Handle email notification
                emailService.sendEmail(event);
            }

        } catch (Exception e) {
            log.error("Failed to process email notification event", e);
        }
    }

    @KafkaListener(topics = "websocket-notification")
    public void handleWebSocketNotification(NotificationEvent event) {
        try {
            log.info("Received WebSocket notification event for: {}", event.getRecipient());

            if ("WEBSOCKET".equals(event.getChannel())) {
                String scope =
                        event.getParam() != null ? (String) event.getParam().get("scope") : null;

                if ("ALL_COMPANY".equals(scope)) {
                    // Send to all connected users
                    webSocketNotificationService.sendNotificationToAll(event);
                } else {
                    // Persist and send to specific user
                    webSocketNotificationService.sendNotificationToUser(event.getRecipient(), event);
                }
            }

        } catch (Exception e) {
            log.error("Failed to process WebSocket notification event", e);
        }
    }
}
