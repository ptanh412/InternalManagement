package com.mnp.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSubmissionRequest {
    @NotBlank(message = "Description is required")
    String description;

    String attachmentUrl;
}
