package com.mnp.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSubmissionUpdateRequest {
    String description;
    List<TaskSubmissionRequest.AttachmentInfo> attachments;
    
    // Employee's updated progress percentage
    Double progressPercentage;
}
