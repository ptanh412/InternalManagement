package com.mnp.assignment.dto;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentRecommendationDto {
    String userId;
    String taskId;

    // User information
    String firstName;
    String lastName;
    String employeeId;
    String avatar;
    String positionName;

    Double overallScore;
    Double contentBasedScore;
    Double collaborativeFilteringScore;
    Double hybridScore;
    Double skillMatchScore;
    Double workloadScore;
    Double performanceScore;
    Double availabilityScore;
    Double collaborationScore;
    String recommendationReason;
    Integer rank;
}
