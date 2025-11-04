package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.util.List;

/**
 * Request DTO for task assignment recommendations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentRequestDto {

    @NotNull(message = "Task details are required")
    @Valid
    private TaskDetailsDto task;

    @NotNull(message = "Candidate list is required")
    @Valid
    private List<UserProfileDto> candidates;

    @Min(value = 1, message = "Max recommendations must be at least 1")
    @Max(value = 20, message = "Max recommendations cannot exceed 20")
    private int maxRecommendations = 5;

    private boolean includeExplanations = true;
    
    private String requestId;
}