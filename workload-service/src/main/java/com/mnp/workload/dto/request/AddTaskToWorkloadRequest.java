package com.mnp.workload.dto.request;

import com.mnp.workload.enums.TaskPriority;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddTaskToWorkloadRequest {
    @NotBlank(message = "Task ID is required")
    String taskId;

    @NotBlank(message = "Project ID is required")
    String projectId;

    @NotNull(message = "Estimated hours is required")
    @Min(value = 1, message = "Estimated hours must be at least 1")
    Integer estimatedHours;

    TaskPriority priority = TaskPriority.MEDIUM;

    LocalDateTime dueDate;

    String taskTitle;
}
