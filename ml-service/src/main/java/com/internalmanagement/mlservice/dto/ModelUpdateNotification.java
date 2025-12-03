package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelUpdateNotification {

    private String trainingId;

    private Double accuracy;

    private Double f1Score;

    private LocalDateTime lastUpdated;

    private Integer sampleSize;

    private String modelVersion;

    private String algorithmType;
}
