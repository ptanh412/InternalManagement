package com.mnp.project.dto.request;

import com.mnp.project.enums.ProjectPriority;
import com.mnp.project.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateProjectRequest {
    @NotBlank(message = "Project name is required")
    String name;

    String description;

    @NotBlank(message = "Project leader ID is required")
    String projectLeaderId;

    String teamLeadId; // Optional team lead (can be different from project leader)

    ProjectStatus status;
    ProjectPriority priority;

    BigDecimal budget;

    @NotNull(message = "Start date is required")
    LocalDateTime startDate;

    @NotNull(message = "End date is required")
    LocalDateTime endDate;
}
