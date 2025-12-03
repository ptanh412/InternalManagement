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
public class ContinuousTrainingStatusDto {

    private boolean enabled;

    private String frequency;

    private LocalDateTime nextScheduledRun;

    private LocalDateTime lastRun;

    private LocalDateTime configuredAt;

    private String status;

    private String lastRunResult;

    private int successfulRuns;

    private int failedRuns;
}
