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
public class ReviewUpdateRequest {
    @NotNull(message = "Status is required")
    SubmissionStatus status;

    String comments;
    
    // Quality rating from 1-5 (5 being excellent)
    Integer qualityRating;
    
    // Task complexity assessment for performance calculation
    String taskComplexity; // LOW, MEDIUM, HIGH, CRITICAL
}
