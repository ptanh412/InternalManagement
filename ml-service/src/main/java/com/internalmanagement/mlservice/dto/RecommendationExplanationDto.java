package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationExplanationDto {

    private boolean success;

    private String taskId;

    private String userId;

    private String explanation;

    private List<String> factors;

    private Double confidence;

    private LocalDateTime generatedAt;

    private String message;
}
