package com.mnp.task.dto.response;

import com.mnp.task.enums.TaskPriority;
import com.mnp.task.enums.TaskStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskResponse {
    String id;
    String title;
    String projectId;
    String reporterId;
    String type;
    String assignedTo;

    String description;
    TaskStatus status;

    TaskPriority priority;
    // ✅ NEW: Extension tracking fields for frontend
    Integer originalEstimatedHours;
    Integer estimatedHours;
    Integer actualHours;

    Integer extensionCount;
    Integer totalExtensionHours;
    LocalDateTime lastExtensionDate;
    Boolean hadExtension;
    Boolean hasPendingExtension;

    LocalDateTime originalDueDate;
    LocalDateTime dueDate;

    LocalDateTime startedAt;
    LocalDateTime completedAt;
    LocalDateTime assignedAt;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    Double progressPercentage;
    List<String> tags;
    //add attributes dependencies and skills later
    TaskDependencyResponse[] dependencies;
    String assigneeId;
    String createdBy;

    // Additional fields for AI recommendation system
    List<String> requiredSkills;  // Skills needed for this task
    String taskType;              // FRONTEND_DEVELOPMENT, BACKEND_DEVELOPMENT, etc.
    String department;            // FE, BE, QA, etc.
    String difficulty;            // EASY, MEDIUM, HARD
}
