package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.util.List;

/**
 * DTO for task details in ML requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskDetailsDto {

    @NotBlank(message = "Task ID is required")
    private String taskId;

    private String title;

    private String description;

    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, CRITICAL

    private String difficulty = "MEDIUM"; // EASY, MEDIUM, HARD

    @Min(value = 0, message = "Estimated hours must be non-negative")
    private Double estimatedHours = 8.0;

    private List<String> requiredSkills;

    private String departmentId;

    private String projectId;

    // Additional task metadata
    private String taskType;
    
    private boolean isUrgent = false;
    
    private String complexity; // SIMPLE, MODERATE, COMPLEX
}