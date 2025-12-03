package com.mnp.ai.dto.response;

import java.util.List;

import com.mnp.ai.enums.TaskPriority;
import com.mnp.ai.enums.TaskType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskRecommendation {
    private String title;
    private String description;
    private TaskPriority priority;
    private TaskType type;
    private Integer estimatedHours;
    private List<String> tags;
    private List<String> dependencies;
    private String assigneeRole; // FRONTEND_DEVELOPER, BACKEND_DEVELOPER, etc.
    private Double confidenceScore; // AI confidence in recommendation (0-1)
    private List<RequiredSkill> requiredSkills; // Skills needed for this task
}
