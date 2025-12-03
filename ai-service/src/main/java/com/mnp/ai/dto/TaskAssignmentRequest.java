package com.mnp.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for ML Service task assignment recommendations
 * This matches the ML service's expected TaskAssignmentRequestDto structure
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentRequest {

    private TaskDetails task;
    private List<String> excludeUserIds;
    private String requesterUserId;
    private String priority;
    private Integer maxRecommendations;
    private boolean useAIRecommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskDetails {
        private String taskId;
        private String title;
        private String description;
        private String priority;
        private String difficulty;
        private Double estimatedHours;
        private List<String> requiredSkills;
        private String departmentId;
        private String projectId;
        private String taskType;
        private boolean isUrgent;
        private String complexity;
    }
}
