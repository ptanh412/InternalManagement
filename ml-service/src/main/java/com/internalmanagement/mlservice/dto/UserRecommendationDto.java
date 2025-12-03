package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
class UserRecommendationDto {

    private String userId;

    private String email;

    private String fullName;

    private Double confidenceScore;

    private Double contentScore;

    private Double collaborativeScore;

    private Integer rank;

    // Detailed reasoning
    private RecommendationReasoningDto reasoning;

    // Risk factors
    private List<String> riskFactors;

    // Strengths
    private List<String> strengths;
}
