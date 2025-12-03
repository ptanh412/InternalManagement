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
public class TaskAssignmentEvent {

    private String taskId;

    private String assignedUserId;

    private LocalDateTime assignedAt;

    private Double estimatedHours;

    private String assignmentMethod;

    private Double predictionConfidence;

    private String assignedBy;
}
