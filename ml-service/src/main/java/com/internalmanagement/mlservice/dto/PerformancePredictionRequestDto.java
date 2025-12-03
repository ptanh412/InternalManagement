package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformancePredictionRequestDto {

    private String taskId;

    private String userId;

    private String taskType;

    private Integer estimatedHours;

    private String priority;
}
