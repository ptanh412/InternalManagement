package com.devteria.notification.entity;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Document(collection = "user_notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserNotification {
    @Id
    String id;

    @Field("user_id")
    String userId;

    @Field("notification_type")
    String type;

    @Field("title")
    String title;

    @Field("message")
    String message;

    @Field("data")
    Map<String, String> data;

    @Field("is_read")
    @Builder.Default
    Boolean isRead = false;

    @Field("channel")
    String channel;

    @Field("template_code")
    String templateCode;

    @Field("created_at")
    LocalDateTime createdAt;

    @Field("read_at")
    LocalDateTime readAt;

    public void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}
