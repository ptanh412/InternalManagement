package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.util.List;
import java.util.Map;

/**
 * DTO for user profile in ML requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    @NotBlank(message = "User ID is required")
    private String userId;

    @NotBlank(message = "Email is required")
    private String email;

    private String firstName;
    
    private String lastName;

    private String departmentName;

    private String seniorityLevel = "MID_LEVEL"; // INTERN, JUNIOR, MID_LEVEL, SENIOR, LEAD, PRINCIPAL

    private List<String> skills;

    private List<String> skillLevels; // BEGINNER, INTERMEDIATE, ADVANCED

    @Min(value = 0, message = "Years of experience must be non-negative")
    private Double yearsExperience = 0.0;

    @Min(value = 0, message = "Utilization must be between 0 and 1")
    @Max(value = 1, message = "Utilization must be between 0 and 1")
    private Double utilization = 0.8;

    @Min(value = 0, message = "Capacity must be positive")
    private Double capacity = 40.0;

    // Additional user metadata
    private String timezone;
    
    private String location;
    
    private Map<String, Object> preferences;
    
    // Performance history
    private Double averagePerformanceScore;
    
    private Integer completedTasksCount;
    
    private Double averageTaskCompletionTime;
}