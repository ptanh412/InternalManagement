package com.mnp.task.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddProjectMemberRequest {
    @NotBlank(message = "Project ID is required")
    String projectId;

    @NotBlank(message = "User ID is required")
    String userId;

    String role; // Using String instead of enum since task-service might not have ProjectRole enum
    LocalDateTime joinedAt;
}
