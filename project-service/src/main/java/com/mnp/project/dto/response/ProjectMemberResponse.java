package com.mnp.project.dto.response;

import com.mnp.project.enums.ProjectRole;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectMemberResponse {
    String id;
    String projectId;
    String userId;
    ProjectRole role;
    LocalDateTime joinedAt;
    LocalDateTime leftAt;
    boolean isActive;
}
