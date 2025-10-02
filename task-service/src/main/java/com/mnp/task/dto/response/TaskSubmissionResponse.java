package com.mnp.task.dto.response;

import com.mnp.task.enums.SubmissionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSubmissionResponse {
    String id;
    String taskId;
    String taskTitle; // For better UX
    String submittedBy;
    String submittedByName; // For better UX
    String description;
    String attachmentUrl;
    SubmissionStatus status;
    String reviewComments;
    String reviewedBy;
    String reviewedByName; // For better UX
    LocalDateTime reviewedAt;
    LocalDateTime submittedAt;
}
