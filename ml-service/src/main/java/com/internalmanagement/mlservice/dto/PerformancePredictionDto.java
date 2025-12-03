package com.internalmanagement.mlservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class PerformancePredictionDto {

    private boolean success;

    private String message;

    private String taskId;

    private String userId;

    @Min(0)
    @Max(1)
    private Double predictedPerformanceScore;

    private Double predictedScore;

    private Double confidenceScore;

    private Double confidence;

    private Double estimatedCompletionTimeHours;

    private Double estimatedCompletionTime;

    private String riskLevel; // LOW, MEDIUM, HIGH

    private List<String> riskFactors;

    private List<String> successFactors;

    private LocalDateTime predictionDate;

    private LocalDateTime predictedAt;

    private String modelVersion;
}
