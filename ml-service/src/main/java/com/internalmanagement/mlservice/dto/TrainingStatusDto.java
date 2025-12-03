package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

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

    private String trainingId;

    private String currentStatus;

    private LocalDateTime estimatedCompletion;

    private String currentStep;

    private Integer totalSteps;

    private Integer currentStepNumber;

    private String dataSource;
}

