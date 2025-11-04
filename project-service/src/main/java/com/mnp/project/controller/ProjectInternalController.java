package com.mnp.project.controller;

import com.mnp.project.service.ProjectIntegrationService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/project/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectInternalController {

    ProjectIntegrationService projectIntegrationService;

    /**
     * Called by task-service when a task is created with required skills
     */
    @PostMapping("/{projectId}/skills/update")
    public ResponseEntity<Void> updateProjectSkillsFromTask(
            @PathVariable String projectId,
            @RequestBody List<String> requiredSkills) {

        log.info("Received request to update project skills for project: {} with skills: {}", projectId, requiredSkills);

        try {
            projectIntegrationService.updateProjectSkillsFromTask(projectId, requiredSkills);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to update project skills for project: {}", projectId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Called by task-service when a task is created with skill proficiency requirements
     */
    @PostMapping("/{projectId}/skills/update-map")
    public ResponseEntity<Void> updateProjectSkillsFromTaskMap(
            @PathVariable String projectId,
            @RequestBody Map<String, Double> requiredSkillsMap) {

        log.info("Received request to update project skills from map for project: {} with {} skills",
                projectId, requiredSkillsMap.size());

        try {
            projectIntegrationService.updateProjectSkillsFromTaskMap(projectId, requiredSkillsMap);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to update project skills from map for project: {}", projectId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Called by task-service when a task is assigned to a user
     */
    @PostMapping("/{projectId}/members/add")
    public ResponseEntity<Void> addProjectMemberFromTaskAssignment(
            @PathVariable String projectId,
            @RequestParam String userId) {

        log.info("Received request to add member {} to project: {}", userId, projectId);

        try {
            projectIntegrationService.addProjectMemberFromTaskAssignment(projectId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to add member {} to project: {}", userId, projectId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
