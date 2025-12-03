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
public class TaskCompletionEvent {

    private String taskId;

    private String assignedUserId;

    private LocalDateTime completedAt;

    private Double actualHours;

    private Double estimatedHours;

    private Double qualityScore;

    private String status;
}
