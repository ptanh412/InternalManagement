package com.mnp.task.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCurrentTaskResponse {
    String id;
    String userId;
    String taskId;
    String projectId;
    String taskTitle;
    Integer estimatedHours;
    Integer remainingHours;
    Integer actualHoursSpent;
    Double progressPercentage;
    String priority;
    String status;
    LocalDateTime dueDate;
    LocalDateTime assignedDate;
}
