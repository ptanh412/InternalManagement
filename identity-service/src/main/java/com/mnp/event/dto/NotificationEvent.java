package com.mnp.event.dto;

import java.util.Map;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationEvent {
    String channel;
    String recipient;
    String recipientName; // Add recipient name for better email formatting
    String templateCode;
    Map<String, Object> param;
    String subject;
    String body;
    String contentType; // Add content type (text/plain, text/html)
}
