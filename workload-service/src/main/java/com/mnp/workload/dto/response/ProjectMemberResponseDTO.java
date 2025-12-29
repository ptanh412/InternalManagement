package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectMemberResponseDTO {
    String id;
    String projectId;
    String userId;
    String role;
    LocalDateTime joinedAt;
    LocalDateTime leftAt;
    boolean isActive;
}
