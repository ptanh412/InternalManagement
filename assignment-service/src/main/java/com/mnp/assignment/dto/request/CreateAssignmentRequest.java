package com.mnp.assignment.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateAssignmentRequest {
    @NotBlank(message = "INVALID_TASK_ID")
    String taskId;

    @NotBlank(message = "INVALID_USER_ID")
    String candidateUserId;

    String assignmentReason;
    String projectId; // Added for chat group integration

    Double assigmentScore;
    Double skillMatchScore;
    Double workLoadScore;
    Double performanceScore;
    Double availabilityScore;
}
