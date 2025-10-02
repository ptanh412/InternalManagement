package com.mnp.ai.model;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentRecommendation {
    String userId;
    String taskId;
    Double overallScore; // Final recommendation score (0-1)

    // Individual algorithm scores
    Double contentBasedScore;
    Double collaborativeFilteringScore;
    Double hybridScore;

    // MCDA scores
    Double topsScore;
    Double ahpScore;

    // Random Forest prediction
    Double rfPredictionScore;
    Double rfConfidence;

    // Individual criteria scores
    Double skillMatchScore;
    Double workloadScore;
    Double performanceScore;
    Double availabilityScore;
    Double collaborationScore;

    String recommendationReason;
    Integer rank; // Ranking among all candidates
}
