package com.mnp.ai.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple request DTO for ML Service recommendations - test version
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleMLRecommendationRequest {
    private String taskId;
    private String taskTitle;
    private String taskDescription;
    private String priority;
    private String difficulty;
    private Map<String, Double> requiredSkills;
    private Integer estimatedHours;
    private String department;
    private String projectId;
    // Removed complex type for compilation test
    private List<String> userIds;
}
