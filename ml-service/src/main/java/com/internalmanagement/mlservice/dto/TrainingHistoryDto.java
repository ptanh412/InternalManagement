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
public class TrainingHistoryDto {

    private Long id;

    private String trainingId;

    private LocalDateTime trainingDate;

    private String modelVersion;

    private String status;

    private Double accuracy;

    private Double f1Score;

    private Double precisionScore;

    private Double recallScore;

    private Integer trainingRecords;

    private String trainingType;

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    private String message;
}
