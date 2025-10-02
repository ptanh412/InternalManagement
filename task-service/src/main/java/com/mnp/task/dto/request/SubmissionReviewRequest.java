package com.mnp.task.dto.request;

import com.mnp.task.enums.SubmissionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SubmissionReviewRequest {
    @NotNull(message = "Review status is required")
    SubmissionStatus status; // APPROVED or REJECTED

    String reviewComments;
}
