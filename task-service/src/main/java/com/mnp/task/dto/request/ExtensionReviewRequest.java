package com.mnp.task.dto.request;

import com.mnp.task.enums.ExtensionStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExtensionReviewRequest {
    @NotNull(message = "Status is required (APPROVED or REJECTED)")
    ExtensionStatus status;

    String reviewComments;

    // Optional: team-lead can provide a modified new due date (YYYY-MM-DD)
    LocalDate newDueDate;
}
