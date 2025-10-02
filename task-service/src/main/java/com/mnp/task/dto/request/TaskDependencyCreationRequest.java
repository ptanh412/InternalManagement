package com.mnp.task.dto.request;

import com.mnp.task.enums.DependencyType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import jakarta.validation.constraints.NotBlank;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskDependencyCreationRequest {
    @NotBlank(message = "Depends on task ID is required")
    String dependsOnTaskId;

    DependencyType type = DependencyType.FINISH_TO_START;

    String description;
}
