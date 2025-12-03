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
public class DataValidationDto {

    private boolean isValid;

    private int totalRecords;

    private int validRecords;

    private int invalidRecords;

    private List<String> validationErrors;

    private double dataQualityScore;

    private LocalDateTime validatedAt;

    private String dataSource;

    private Integer monthsValidated;

    private List<DataQualityMetricDto> qualityMetrics;

    private String message;
}
