package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureImportanceDto {

    private String modelVersion;

    private LocalDateTime calculatedAt;

    private Map<String, Double> featureImportances;

    private List<FeatureImportanceItemDto> topFeatures;
}
