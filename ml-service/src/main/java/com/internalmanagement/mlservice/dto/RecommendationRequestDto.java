package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationRequestDto {

    private String taskId;

    private String taskTitle;

    private String taskDescription;

    private String requestId;

    private String priority;

    private List<RecommendationItemDto> recommendations;


    private String taskType;

    private List<String> requiredSkills;

    private Integer estimatedHours;

    private String departmentId;

    private String projectId;

    private Map<String, Object> additionalCriteria;

    private Integer maxRecommendations;

    private String algorithm;
}
