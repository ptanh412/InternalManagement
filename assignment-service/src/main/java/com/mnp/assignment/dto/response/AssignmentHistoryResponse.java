package com.mnp.assignment.dto.response;

import com.mnp.assignment.ReassignmentReason;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentHistoryResponse {
    String id;
    String taskId;
    String previousAssignee;
    String newAssignee;
    String reassignedBy;
    ReassignmentReason reason;
    String comments;
    LocalDateTime reassignedAt;
}
