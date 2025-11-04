package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Response DTO for recommendation requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponseDto {

    private boolean success;
    
    private String message;
    
    private String requestId;
    
    private List<UserRecommendationDto> recommendations;
    
    private int totalCandidates;
    
    private LocalDateTime generatedAt;
    
    // Model metadata
    private String modelVersion;
    
    private Double modelConfidence;
    
    // Processing information
    private Long processingTimeMs;
    
    private Map<String, Object> metadata;
}

/**
 * Individual user recommendation within the response
 */
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

/**
 * Reasoning details for a recommendation
 */
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