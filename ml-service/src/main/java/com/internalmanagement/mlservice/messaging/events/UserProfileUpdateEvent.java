package com.internalmanagement.mlservice.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateEvent {

    private String userId;

    private String eventType;

    private LocalDateTime updatedAt;

    private String updatedField;

    private Object oldValue;

    private Object newValue;
}
