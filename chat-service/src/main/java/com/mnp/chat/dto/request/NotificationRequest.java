package com.mnp.chat.dto.request;

import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationRequest {
    String channel; // "EMAIL", "WEBSOCKET", "PUSH"
    String recipient; // User ID
    String recipientName; // User's full name
    String templateCode; // Template identifier
    Map<String, Object> param; // Template parameters
    String subject; // Notification subject
    String body; // Notification body
    String contentType; // "text/plain", "text/html"
    String type; // Notification type: "CHAT_GROUP_ADDED", etc.
    String title; // Notification title
    Map<String, String> data; // Additional data
}
