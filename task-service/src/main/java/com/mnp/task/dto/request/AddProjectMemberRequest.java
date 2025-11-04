package com.mnp.task.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AddProjectMemberRequest {
    String projectId;
    String userId;
    String role = "MEMBER"; // Default role
    LocalDateTime joinedAt = LocalDateTime.now(); // Default to current time
}
