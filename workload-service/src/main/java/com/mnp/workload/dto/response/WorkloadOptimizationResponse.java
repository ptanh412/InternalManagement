package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WorkloadOptimizationResponse {
    String projectId;
    String projectName;
    String optimizationStatus;
    List<WorkloadRebalancingSuggestion> suggestions;
    Double currentProjectUtilization;
    Double optimizedProjectUtilization;
    String estimatedCompletionImprovement;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class WorkloadRebalancingSuggestion {
        String suggestionType; // "REASSIGN", "REDISTRIBUTE", "ADD_RESOURCE"
        String fromUserId;
        String toUserId;
        String taskId;
        String reason;
        Integer hoursToMove;
        Double impactScore;
    }
}
