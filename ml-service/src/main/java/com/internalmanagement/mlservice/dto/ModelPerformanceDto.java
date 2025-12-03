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
public class ModelPerformanceDto {

    private String currentModelVersion;

    private LocalDateTime lastTrainingDate;

    // Current performance metrics
    private Double accuracy;
    private Double f1Score;
    private Double precision;
    private Double recall;
    private Double rocAuc;

    // Performance trends
    private List<PerformanceTrendDto> performanceTrend;

    // Model health indicators
    private LocalDateTime lastUpdated;

    private Integer sampleSize;

    private String modelVersion;

    private Integer trainingDataSize;
    private String healthStatus; // HEALTHY, DEGRADED, UNHEALTHY
    private String healthMessage;

    private Long totalPredictions;
    private Double averageConfidence;
}