package com.mnp.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskResponse {
    String id; // Changed from taskId to id to match task service
    String projectId;
    String title;
    String description;
    String createdBy;
    String assignedTo;
    String assigneeId;
    String reporterId;
    String type;
    String priority; // Will receive enum as string
    String status; // Will receive enum as string
    Integer estimatedHours;
    Integer originalEstimatedHours; // Original estimate before any extensions
    Integer actualHours;

    // Extension tracking fields
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
    Double progressPercentage;
    List<String> tags;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    TaskDependencyResponse[] dependencies; // Add the missing dependencies field

    // AI recommendation fields from task service
    List<String> requiredSkills; // Skills needed for this task
    String taskType; // FRONTEND_DEVELOPMENT, BACKEND_DEVELOPMENT, etc.
    String department; // FE, BE, QA, etc.
    String difficulty; // EASY, MEDIUM, HARD

    // Additional fields that might be used by AI (these will be null from task service)
    Map<String, Double> skillTypes;
    Map<String, Integer> skillExperience;
    List<String> certifications;
    Double experienceYears;
    Double performanceRating;
    Double averageTaskTime;
    List<String> preferredTaskTypes;
    List<String> preferredDepartments;
    List<String> previousTaskIds;
    Map<String, Double> taskTypeSuccess;
    String name;
    String role;
    Boolean isUrgent;
    Integer teamSize;
    List<String> prerequisites;
    Integer qualityRating;
    String qualityComments;
}
