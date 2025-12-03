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
class RecommendationReasoningDto {

    private Double skillMatchScore;

    private Double experienceScore;

    private Double workloadScore;

    private Double performanceHistoryScore;

    private String explanation;

    // Feature contributions
    private Map<String, Double> featureContributions;

    // Similar past assignments
    private List<String> similarTaskIds;
}
