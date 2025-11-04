package com.mnp.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PerformanceDetailsResponse {
    String userId;
    String userName;
    String userEmail;
    
    // Overall performance score
    Double performanceScore;
    
    // Individual component scores
    Double qualityScore;
    Double timelinessScore;
    Double completionRate;
    Double efficiencyScore;
    
    // Raw metrics
    Integer totalTasksAssigned;
    Integer totalTasksCompleted;
    Integer totalTasksOnTime;
    Double totalEstimatedHours;
    Double totalActualHours;
    Double averageQualityRating;
    
    // Timestamps
    LocalDateTime lastPerformanceUpdate;
    LocalDateTime lastCalculated;
    
    // Additional context
    String performanceCategory; // EXCEPTIONAL, HIGH, GOOD, AVERAGE, BELOW_AVERAGE, POOR
    String[] strengthAreas;
    String[] improvementAreas;
}