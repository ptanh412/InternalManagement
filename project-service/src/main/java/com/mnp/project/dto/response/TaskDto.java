package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskDto {
    String id;
    String assignedTo;
    String reporterId;
    String title;
    String description;
    String type;
    String priority;
    String status;
    Double progressPercentage;
    List<String> tags;
    List<TaskDependencyDto> taskDependencies;
    List<TaskSkillDto> requiredSkills;
}
