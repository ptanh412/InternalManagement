package com.mnp.ai.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAnalysisResponse {
    private List<TaskRecommendation> tasks;
    private Integer totalTasks;
    private String analysisType; // FILE, TEXT
    private String projectSummary;
    private List<String> suggestedMilestones;
    private Integer estimatedTotalHours;
    private String aiModel; // GPT-4, CLAUDE, etc.
    private Long processingTimeMs;
}
