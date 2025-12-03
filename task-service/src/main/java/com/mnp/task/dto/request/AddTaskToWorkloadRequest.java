package com.mnp.task.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddTaskToWorkloadRequest {
    String taskId;
    String projectId;
    Integer estimatedHours;
    String priority; // Using String to match task priority enum
    LocalDateTime dueDate;
    String taskTitle;
}
