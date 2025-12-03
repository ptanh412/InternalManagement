package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingResponseDto {

    private boolean success;

    private String message;

    private String trainingId;

    private String status; // QUEUED, RUNNING, COMPLETED, FAILED

    private java.time.LocalDateTime startedAt;

    private String estimatedDuration;

    private String pythonCommand;
}
