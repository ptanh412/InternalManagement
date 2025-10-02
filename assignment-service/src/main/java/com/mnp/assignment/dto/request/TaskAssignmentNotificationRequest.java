package com.mnp.assignment.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskAssignmentNotificationRequest {

    String channel; // WEBSOCKET, EMAIL, SMS, etc.
    String recipient; // User ID who will receive the notification
    String recipientName; // User name for personalization
    String type; // TASK_ASSIGNED, TASK_REASSIGNED, TASK_DUE_REMINDER, etc.
    String title; // Notification title
    String body; // Notification message body
    String contentType; // text/plain, text/html, etc.
    String templateCode; // Optional template code for formatted notifications

    Map<String, Object> param; // Additional parameters for the notification
    Map<String, String> data; // Extra data for mobile/web app handling

    // Optional fields for advanced notification features
    String priority; // HIGH, MEDIUM, LOW
    Long ttl; // Time to live in seconds
    Boolean persistent; // Whether to persist the notification
    String category; // Notification category for grouping
}
