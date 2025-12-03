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
public class ModelStatusDto {

    private boolean available;

    private String message;

    private String modelVersion;

    private LocalDateTime lastTraining;

    private Double healthScore;

    private String healthStatus;

    private Map<String, Object> metrics;
}
