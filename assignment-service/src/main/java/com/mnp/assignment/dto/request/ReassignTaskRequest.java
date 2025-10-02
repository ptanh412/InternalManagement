package com.mnp.assignment.dto.request;

import com.mnp.assignment.ReassignmentReason;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReassignTaskRequest {
    @NotBlank(message = "INVALID_USER_ID")
    String newAssigneeId;

    @NotNull(message = "REASSIGNMENT_REASON_REQUIRED")
    ReassignmentReason reason;

    String reasonText; // Additional text description for the reason

    String comments;

    @NotBlank(message = "INVALID_USER_ID")
    String reassignedBy;

    // Helper method to get reason text as String
    public String getReasonText() {
        if (reasonText != null && !reasonText.isEmpty()) {
            return reasonText;
        }
        return reason != null ? reason.toString() : null;
    }

}
