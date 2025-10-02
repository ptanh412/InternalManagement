package com.mnp.task.dto.response;

import com.mnp.task.enums.DependencyType;
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
    DependencyType type;
    LocalDateTime createdAt;
}
