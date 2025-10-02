package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskDependencyDto {
    String id;
    String dependsOnTaskId;
    String dependsOnTaskTitle;
    String dependencyType;
    String description;
}
