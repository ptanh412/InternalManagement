package com.mnp.task.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectResponse {
    String id;
    String name;
    String description;
    String projectLeaderId;
    String teamLeadId;
    String status;
    String priority;
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
}
