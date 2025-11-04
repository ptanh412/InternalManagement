package com.mnp.project.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InternalNotificationRequest {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Notification type is required")
    private String type;

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Message is required")
    private String message;

    private Map<String, Object> data;

    private String channel;

    private String templateCode;

    @Builder.Default
    private boolean realTime = true;
}
