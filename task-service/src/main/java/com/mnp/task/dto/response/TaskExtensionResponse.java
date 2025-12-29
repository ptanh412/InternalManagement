package com.mnp.task.dto.response;

import com.mnp.task.enums.ExtensionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskExtensionResponse {
    String id;
    String taskId;
    String taskTitle;
    String requestedBy;
    String requestedByName;
    String reviewedBy;
    String reviewedByName;

    Integer extensionHours;
    LocalDateTime newDueDate;
    String reason;


    ExtensionStatus status;
    String reviewComments;

    LocalDateTime requestedAt;
    LocalDateTime reviewedAt;

    // Task info
    Integer originalEstimatedHours;
    Integer currentEstimatedHours;
    LocalDateTime originalDueDate;
    LocalDateTime currentDueDate;
    Integer extensionCount;
    Integer totalExtensionHours;
    Integer remainingExtensions;

    String message;
}
