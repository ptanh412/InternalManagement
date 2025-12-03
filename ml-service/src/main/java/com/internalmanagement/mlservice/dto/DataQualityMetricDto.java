package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataQualityMetricDto {

    private String metricName;

    private double value;

    private String status;

    private String description;

    private double threshold;
}
