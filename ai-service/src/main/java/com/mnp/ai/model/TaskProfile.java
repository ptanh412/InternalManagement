package com.mnp.ai.model;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskProfile {
    // Core fields aligned with Task entity
    String taskId;
    String projectId;
    String title;
    String description;
    String createdBy;
    String assignedTo;

    // Enum-based fields for consistency
    String type; // Maps to TaskType enum
    String taskType; // FRONTEND_DEVELOPMENT, BACKEND_DEVELOPMENT, etc.
    String priority; // Maps to TaskPriority enum (LOW, MEDIUM, HIGH, URGENT)
    String status; // Maps to TaskStatus enum

    // Time-related fields aligned with Task entity
    Integer estimatedHours;
    Integer actualHours;
    LocalDateTime dueDate;
    LocalDateTime startedAt;
    LocalDateTime completedAt;
    Double progressPercentage;

    // AI/ML specific fields
    Map<String, Double> requiredSkills; // skill -> minimum proficiency required
    String difficulty; // EASY, MEDIUM, HARD, EXPERT
    String department;

    // Task constraints
    Boolean isUrgent;
    Integer teamSize; // if it's a team task
    List<String> prerequisites; // required completed tasks

    // Task characteristics for content-based filtering
    List<String> tags;
    Double complexityScore; // 0-1

    // Historical data for AI recommendations
    List<String> previousAssignees;
    Map<String, Double> skillSuccessRate; // skill -> success rate for this task type
    Double averageCompletionTime;

    // Quality metrics from Task entity
    Integer qualityRating;
    String qualityComments;

    // Method to fix compilation errors in HybridRecommendationAlgorithm
    public String getTaskType() {
        return type;
    }
}
