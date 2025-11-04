package com.mnp.identity.dto.request;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PerformanceUpdateRequest {
    String userId;
    String taskId;
    Integer qualityRating;    // 1-5 scale rating
    boolean completedOnTime;
    String taskComplexity;    // LOW, MEDIUM, HIGH, CRITICAL
    Integer estimatedHours;
    Integer actualHours;
    String comments;
}