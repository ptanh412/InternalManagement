package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Request DTO for model training
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingRequestDto {

    private boolean forceRetrain = false;
    
    private boolean useSyntheticData = false;
    
    private int dataMonthsBack = 12;
    
    private String trainingType = "HYBRID"; // CONTENT_ONLY, COLLABORATIVE_ONLY, HYBRID
    
    private boolean enableHyperparameterTuning = true;
    
    private String requestedBy;
    
    private String reason;
}

/**
 * Response DTO for training requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingResponseDto {

    private boolean success;
    
    private String message;
    
    private String trainingId;
    
    private String status; // QUEUED, RUNNING, COMPLETED, FAILED
}

/**
 * DTO for training status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingStatusDto {

    private String status; // IDLE, TRAINING, COMPLETED, FAILED
    
    private Double progress; // 0.0 to 1.0
    
    private String message;
    
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    private Map<String, Double> metrics;
    
    private String currentStage;
    
    private Long estimatedRemainingMinutes;
}

/**
 * DTO for training history records
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingHistoryDto {

    private Long id;
    
    private LocalDateTime trainingDate;
    
    private String modelVersion;
    
    private Double accuracy;
    
    private Double f1Score;
    
    private Double precisionScore;
    
    private Double recallScore;
    
    private Integer trainingRecords;
    
    private String deploymentStatus;
    
    private Double trainingDurationMinutes;
}

/**
 * DTO for model performance metrics
 */
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
    private String healthStatus; // HEALTHY, DEGRADED, UNHEALTHY
    private String healthMessage;
    
    private Long totalPredictions;
    private Double averageConfidence;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceTrendDto {

    private LocalDateTime date;
    private Double f1Score;
    private Double accuracy;
    private Integer trainingRecords;
}