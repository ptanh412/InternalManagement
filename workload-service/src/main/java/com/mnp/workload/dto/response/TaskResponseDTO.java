package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskResponseDTO {
    String id;
    String title;
    String projectId;
    String reporterId;
    String type;
    String assignedTo;
    String description;
    String status;
    String priority;
    
    // Time tracking fields
    Integer originalEstimatedHours;
    Integer estimatedHours;
    Integer actualHours;
    
    // Extension tracking
    Integer extensionCount;
    Integer totalExtensionHours;
    LocalDateTime lastExtensionDate;
    Boolean hadExtension;
    Boolean hasPendingExtension;
    
    // Date tracking
    LocalDateTime originalDueDate;
    LocalDateTime dueDate;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
    LocalDateTime assignedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    
    // Progress and metadata
    Double progressPercentage;
    List<String> tags;
    String assigneeId;
    String createdBy;
    
    // Additional fields
    List<String> requiredSkills;
    String taskType;
    String department;
    String difficulty;
}
