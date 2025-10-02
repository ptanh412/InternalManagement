package com.mnp.ai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import com.mnp.ai.entity.AnalyzedRequirement;
import com.mnp.ai.entity.GeneratedTask;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequirementAnalysisResponse {

    String projectId;
    String analysisId;
    LocalDateTime processedAt;

    List<String> processedFiles;
    Integer totalRequirementsFound;
    Integer totalTasksGenerated;

    List<AnalyzedRequirement> requirements;
    List<GeneratedTask> recommendedTasks;

    Map<String, Double> identifiedSkills;
    List<String> detectedConflicts;

    Double overallConfidenceScore;
    String processingStatus; // SUCCESS, PARTIAL, FAILED
    List<String> warnings;
    List<String> errors;

    // Processing statistics
    Long processingTimeMs;
    String aiModelUsed;
    Integer tokenCount;
}
