package com.mnp.task.dto.request;

import com.mnp.task.enums.TaskPriority;
import com.mnp.task.enums.TaskStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskUpdateRequest {
    String title;
    String description;
    TaskStatus status;
    TaskPriority priority;
    String assigneeId;
    LocalDateTime dueDate;
}
