package com.mnp.task.dto.response;

import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.enums.SubmissionStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSubmissionResponse {
    String id;
    String taskId;
    String submittedBy;
    String description;
    List<TaskSubmissionRequest.AttachmentInfo> attachments;

    SubmissionStatus status;
    String reviewComments;
    String reviewedBy;
    LocalDateTime reviewedAt;
    LocalDateTime submittedAt;

    // New fields for project and team lead information
    String projectName;
    String teamLeadName;
}
