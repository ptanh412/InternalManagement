package com.mnp.ai.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.mnp.ai.model.AssignmentRecommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO from ML Service recommendations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLRecommendationResponse {
    private boolean success;
    private String requestId;
    private String taskId;
    private List<AssignmentRecommendation> recommendations;
    private Integer totalCandidates;
    private LocalDateTime generatedAt;
    private String algorithm;
    private Double confidence;
    private String message;
}
