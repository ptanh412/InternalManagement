package com.mnp.ai.dto;

import java.util.List;
import java.util.Map;

import com.mnp.ai.model.AssignmentRecommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for ML Service recommendations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLRecommendationRequest {
    private String taskId;
    private String taskTitle;
    private String taskDescription;
    private String priority;
    private String difficulty;
    private Map<String, Double> requiredSkills;
    private Integer estimatedHours;
    private String department;
    private String projectId;
    private List<AssignmentRecommendation> initialRecommendations;
}
