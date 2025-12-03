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
    
    private String taskId;

    private List<RecommendationItemDto> recommendations;

    private int totalCandidates;
    
    private LocalDateTime generatedAt;
    
    private String algorithm;

    private Double confidence;

    // Model metadata
    private String modelVersion;
    
    private Double modelConfidence;
    
    // Processing information
    private Long processingTimeMs;
    
    private Map<String, Object> metadata;
}

