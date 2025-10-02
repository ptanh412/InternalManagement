package com.mnp.project.dto.request;

import com.mnp.project.enums.ProjectRole;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

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

    ProjectRole role = ProjectRole.MEMBER;
}
