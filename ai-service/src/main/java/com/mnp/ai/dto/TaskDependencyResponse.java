package com.mnp.ai.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskDependencyResponse {
    String id;
    String taskId;
    String dependsOnTaskId;
    String dependsOnTaskTitle; // For better UX
    String type; // Using String instead of enum for simplicity in AI service
    LocalDateTime createdAt;
}
