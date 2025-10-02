package com.mnp.ai.mapper;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.mnp.ai.dto.TaskResponse;
import com.mnp.ai.model.TaskProfile;

@Component
public class TaskProfileMapper {

    public TaskProfile fromTaskResponse(TaskResponse taskResponse) {
        if (taskResponse == null) {
            return null;
        }

        return TaskProfile.builder()
                .taskId(taskResponse.getId()) // Changed from getTaskId() to getId()
                .projectId(taskResponse.getProjectId())
                .title(taskResponse.getTitle())
                .description(taskResponse.getDescription())
                .createdBy(taskResponse.getCreatedBy())
                .assignedTo(taskResponse.getAssignedTo())
                .type(taskResponse.getType())
                .taskType(taskResponse.getTaskType()) // Add task type for better matching
                .priority(taskResponse.getPriority())
                .status(taskResponse.getStatus())
                .estimatedHours(taskResponse.getEstimatedHours())
                .actualHours(taskResponse.getActualHours())
                .dueDate(taskResponse.getDueDate())
                .startedAt(taskResponse.getStartedAt())
                .completedAt(taskResponse.getCompletedAt())
                .progressPercentage(taskResponse.getProgressPercentage())
                .requiredSkills(convertRequiredSkillsToMap(
                        taskResponse.getRequiredSkills())) // Convert List<String> to Map<String, Double>
                .difficulty(taskResponse.getDifficulty())
                .department(taskResponse.getDepartment())
                .isUrgent(taskResponse.getIsUrgent())
                .teamSize(taskResponse.getTeamSize())
                .prerequisites(taskResponse.getPrerequisites())
                .tags(taskResponse.getTags())
                .qualityRating(taskResponse.getQualityRating())
                .qualityComments(taskResponse.getQualityComments())
                .build();
    }

    /**
     * Convert List<String> of required skills to Map<String, Double> format
     * This assumes all required skills have a default level of 3.0 (intermediate)
     */
    private Map<String, Double> convertRequiredSkillsToMap(List<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return null;
        }

        Map<String, Double> skillsMap = new HashMap<>();
        for (String skill : requiredSkills) {
            // Default required level is 3.0 (intermediate)
            // You can enhance this later to parse skill levels from the skill string
            // e.g., "React:Advanced" -> {"React": 4.0}
            skillsMap.put(skill.trim().toLowerCase(), 3.0);
        }
        return skillsMap;
    }
}
