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
public class CancelTrainingResponseDto {

    private boolean success;

    private String message;

    private String trainingId;

    private LocalDateTime cancelledAt;
}