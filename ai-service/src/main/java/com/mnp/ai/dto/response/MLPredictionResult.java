package com.mnp.ai.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionResult {
    private String userId;
    private double mlConfidenceScore;
    private String explanation;
    private Map<String, Double> featureImportance;

    @JsonProperty("fallback")
    private boolean isFallback;
}

