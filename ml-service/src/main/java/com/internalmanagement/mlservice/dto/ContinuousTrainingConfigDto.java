package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousTrainingConfigDto {

    private boolean enabled;

    private String message;

    private String frequency;

    private int trainingFrequencyHours;

    private Double minAccuracyImprovement;

    private int minDataSize;

    private boolean autoDeployment;

    private String schedule; // Cron expression
}