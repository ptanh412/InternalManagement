package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskProfileDto {

    private String taskId;

    private String title;

    private String description;

    private String priority;

    private String type;

    private List<String> requiredSkills;

    private Integer estimatedHours;

    private String projectId;

    private String creatorId;

    private LocalDateTime dueDate;

    private String status;
}
