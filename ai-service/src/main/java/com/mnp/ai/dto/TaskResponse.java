package com.mnp.ai.dto;

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
    Integer actualHours;
    LocalDateTime dueDate;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
    Double progressPercentage;
    List<String> tags;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

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
