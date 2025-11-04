package com.mnp.task.service;

import com.mnp.task.client.ProjectIntegrationClient;
import com.mnp.task.dto.request.AddProjectMemberRequest;
import com.mnp.task.entity.TaskRequiredSkill;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectIntegrationService {

    ProjectIntegrationClient projectIntegrationClient;

    /**
     * Update project required skills when a task is created
     */
    public void updateProjectSkillsFromTask(String projectId, List<TaskRequiredSkill> taskRequiredSkills) {
        if (projectId == null || taskRequiredSkills == null || taskRequiredSkills.isEmpty()) {
            log.debug("No project ID or skills provided for project skills update");
            return;
        }

        try {
            // Extract skill names from TaskRequiredSkill entities
            List<String> skillNames = taskRequiredSkills.stream()
                .map(TaskRequiredSkill::getSkillName)
                .filter(skillName -> skillName != null && !skillName.trim().isEmpty())
                .collect(Collectors.toList());

            if (!skillNames.isEmpty()) {
                log.info("Updating project {} with {} required skills from task", projectId, skillNames.size());
                projectIntegrationClient.updateProjectSkillsFromTask(projectId, skillNames);
                log.info("Successfully updated project skills for project: {}", projectId);
            }

        } catch (Exception e) {
            log.error("Failed to update project skills for project: {}", projectId, e);
            // Don't throw exception to avoid breaking task creation
        }
    }

    /**
     * Update project required skills with proficiency levels
     */
    public void updateProjectSkillsFromTaskMap(String projectId, Map<String, Double> requiredSkillsMap) {
        if (projectId == null || requiredSkillsMap == null || requiredSkillsMap.isEmpty()) {
            log.debug("No project ID or skills map provided for project skills update");
            return;
        }

        try {
            log.info("Updating project {} with {} required skills from task map", projectId, requiredSkillsMap.size());
            projectIntegrationClient.updateProjectSkillsFromTaskMap(projectId, requiredSkillsMap);
            log.info("Successfully updated project skills from map for project: {}", projectId);

        } catch (Exception e) {
            log.error("Failed to update project skills from map for project: {}", projectId, e);
            // Don't throw exception to avoid breaking task creation
        }
    }

    /**
     * Add project member when a task is assigned to a user
     */
    public void addProjectMemberFromTaskAssignment(String projectId, String userId) {
        if (projectId == null || userId == null) {
            log.debug("No project ID or user ID provided for adding project member");
            return;
        }

        try {
            log.info("Adding user {} as member to project: {}", userId, projectId);

            AddProjectMemberRequest request = AddProjectMemberRequest.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .role("MEMBER")
                    .build();

            projectIntegrationClient.addProjectMemberFromTaskAssignment(request);
            log.info("Successfully added user {} to project: {}", userId, projectId);

        } catch (Exception e) {
            log.error("Failed to add user {} to project: {}", userId, projectId, e);
            // Don't throw exception to avoid breaking task assignment
        }
    }
}
