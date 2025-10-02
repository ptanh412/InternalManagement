package com.mnp.assignment.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentResponse {
    String id;
    String taskId;
    String candidateUserId;
    Double assigmentScore;
    Double skillMatchScore;
    Double workLoadScore;
    Double performanceScore;
    Double availabilityScore;
    Boolean isSelected;
    String assignmentReason;
    List<String> candidateUsers;
    LocalDateTime createdAt;
    LocalDateTime assignedAt;
}
