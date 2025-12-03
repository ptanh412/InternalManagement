package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureImportanceItemDto {

    private String featureName;

    private Double importance;

    private String description;

    private Double normalizedImportance;

    private Integer rank;
}
