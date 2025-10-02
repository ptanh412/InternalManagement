package com.mnp.project.dto.request;

import com.mnp.project.enums.ProjectRole;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProjectMemberRequest {
    ProjectRole role;
}
