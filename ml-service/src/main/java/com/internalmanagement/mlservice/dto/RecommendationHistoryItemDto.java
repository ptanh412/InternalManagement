package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationHistoryItemDto {

    private String recommendationId;

    private String taskId;

    private String taskTitle;

    private String userId;

    private LocalDateTime recommendationDate;

    private LocalDateTime createdAt;

    private Double confidenceScore;

    private Double score;

    private Integer rank;

    private Boolean wasSelected;

    private Boolean accepted;

    private Double actualPerformance;

    private String outcome;
}
