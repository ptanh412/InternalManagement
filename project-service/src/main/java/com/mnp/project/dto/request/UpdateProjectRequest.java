package com.mnp.project.dto.request;

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
public class UpdateProjectRequest {
    String name;
    String description;
    String projectLeaderId;
    String teamLeadId; // Allow updating team lead separately
    ProjectStatus status;
    ProjectPriority priority;
    BigDecimal budget;
    BigDecimal actualCost;
    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime actualStartDate;
    LocalDateTime actualEndDate;
}
