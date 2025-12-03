package com.mnp.ai.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAnalysisRequest {
    @NotBlank(message = "Content is required")
    private String content;

    private String projectType;
    private String methodology; // AGILE, WATERFALL, SCRUM
    private String priority; // HIGH, MEDIUM, LOW
    private Integer teamSize;
    private String duration; // project duration
}
