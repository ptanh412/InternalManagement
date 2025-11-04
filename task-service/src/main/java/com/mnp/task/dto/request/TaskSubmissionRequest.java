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
public class TaskSubmissionRequest {
    String description;
    List <AttachmentInfo> attachments;
    
    // Employee's final self-assessed progress percentage when submitting
    Double progressPercentage;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttachmentInfo {
        @NotBlank(message = "File name is required")
        String name;

        @NotBlank(message = "File URL is required")
        String url;

        String type;  // MIME type: image/png, application/pdf, etc.
        Long size;    // File size in bytes
    }

}
