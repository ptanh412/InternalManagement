package com.mnp.ai.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskMetricsResponse {
    int totalTasks;
    int completedTasks;
    Double averageQualityRating;
    Double onTimeCompletionRate;
    Double averageTaskDuration;
    Double estimatedActualRatio;
}

