package com.mnp.project.dto.response;

import com.mnp.project.enums.ProjectPriority;
import com.mnp.project.enums.ProjectStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectResponse {
    String id;
    String name;
    String description;
    String projectLeaderId;
    String teamLeadId; // Include team lead in response
    ProjectStatus status;
    ProjectPriority priority;
    BigDecimal budget;
    BigDecimal actualCost;
    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime actualStartDate;
    LocalDateTime actualEndDate;
    Integer totalTasks;
    Integer completedTasks;
    Double completionPercentage;
    List<String> requiredSkills;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Tasks associated with this project
    List<TaskDto> tasks;
}
