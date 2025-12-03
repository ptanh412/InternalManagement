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
public class PerformanceTrendDto {

    private LocalDateTime date;
    private Double f1Score;
    private Double accuracy;
    private Integer trainingRecords;
}
