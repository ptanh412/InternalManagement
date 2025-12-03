package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarCaseDto {

    private String taskId;

    private String taskTitle;

    private Double similarity;

    private Double performanceScore;

    private String outcome;
}