package com.mnp.task.dto.request;

import com.mnp.task.enums.DependencyType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskDependencyRequest {
    @NotBlank(message = "Dependent task ID is required")
    String dependsOnTaskId;

    DependencyType type = DependencyType.FINISH_TO_START;
}
