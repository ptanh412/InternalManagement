package com.mnp.task.dto.request;

import com.mnp.task.enums.TaskPriority;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.enums.TaskType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskCreationRequest {
    @NotBlank(message = "Task title is required")
    String title;

    String description;

    @NotBlank(message = "Project ID is required")
    String projectId;

    String parentTaskId;
    String assigneeId;
    String reporterId;

    TaskType type;

    @NotNull(message = "Task priority is required")
    TaskPriority priority = TaskPriority.MEDIUM;

    TaskStatus status = TaskStatus.TODO;

    Integer estimatedHours;
    LocalDateTime dueDate;

    String comments;

    List<String> tags;

    // Dependencies for this task
    @Valid
    List<TaskDependencyCreationRequest> dependencies;

    // Required skills for this task
    @Valid
    List<TaskSkillRequest> requiredSkills;
}
