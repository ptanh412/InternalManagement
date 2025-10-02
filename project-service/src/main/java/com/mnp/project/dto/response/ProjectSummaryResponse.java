package com.mnp.project.dto.response;

import com.mnp.project.enums.ProjectPriority;
import com.mnp.project.enums.ProjectStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectSummaryResponse {
    String id;
    String name;
    String projectLeaderId;
    ProjectStatus status;
    ProjectPriority priority;
    BigDecimal budget;
    LocalDateTime startDate;
    LocalDateTime endDate;
    Double completionPercentage;
    Integer totalTasks;
    Integer completedTasks;
}
