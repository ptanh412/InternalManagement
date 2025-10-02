package com.mnp.task.dto.request;

import com.mnp.task.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskStatusUpdateRequest {
    @NotNull(message = "Status is required")
    TaskStatus status;

    String comments;
}
