package com.mnp.project.service;

import com.mnp.project.entity.ProjectMember;
import com.mnp.project.entity.ProjectRequiredSkill;
import com.mnp.project.enums.ProficiencyLevel;
import com.mnp.project.enums.ProjectRole;
import com.mnp.project.enums.SkillType;
import com.mnp.project.repository.ProjectMemberRepository;
import com.mnp.project.repository.ProjectRequiredSkillRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectIntegrationService {

    ProjectRequiredSkillRepository projectRequiredSkillRepository;
    ProjectMemberRepository projectMemberRepository;

    /**
     * Update project required skills when a task is created
     */
    @Transactional
    public void updateProjectSkillsFromTask(String projectId, List<String> taskRequiredSkills) {
        if (taskRequiredSkills == null || taskRequiredSkills.isEmpty()) {
            log.debug("No required skills provided for project: {}", projectId);
            return;
        }

        log.info("Updating project required skills for project: {} with {} skills", projectId, taskRequiredSkills.size());

        for (String skillName : taskRequiredSkills) {
            if (skillName == null || skillName.trim().isEmpty()) {
                continue;
            }

            String normalizedSkillName = skillName.trim();

            // Check if skill already exists for this project
            if (!projectRequiredSkillRepository.existsByProjectIdAndSkillName(projectId, normalizedSkillName)) {
                ProjectRequiredSkill projectSkill = ProjectRequiredSkill.builder()
                    .projectId(projectId)
                    .skillName(normalizedSkillName)
                    .skillType(determineSkillType(normalizedSkillName))
                    .requiredLevel(ProficiencyLevel.INTERMEDIATE) // Default to intermediate
                    .isRequired(true)
                    .build();

                projectRequiredSkillRepository.save(projectSkill);
                log.info("Added required skill '{}' to project: {}", normalizedSkillName, projectId);
            } else {
                log.debug("Skill '{}' already exists for project: {}", normalizedSkillName, projectId);
            }
        }
    }

    /**
     * Update project required skills from task skill map with proficiency levels
     */
    @Transactional
    public void updateProjectSkillsFromTaskMap(String projectId, Map<String, Double> taskRequiredSkillsMap) {
        if (taskRequiredSkillsMap == null || taskRequiredSkillsMap.isEmpty()) {
            log.debug("No required skills map provided for project: {}", projectId);
            return;
        }

        log.info("Updating project required skills from map for project: {} with {} skills",
                projectId, taskRequiredSkillsMap.size());

        for (Map.Entry<String, Double> entry : taskRequiredSkillsMap.entrySet()) {
            String skillName = entry.getKey();
            Double proficiencyScore = entry.getValue();

            if (skillName == null || skillName.trim().isEmpty()) {
                continue;
            }

            String normalizedSkillName = skillName.trim();
            ProficiencyLevel requiredLevel = convertScoreToProficiencyLevel(proficiencyScore);

            // Check if skill already exists for this project
            var existingSkill = projectRequiredSkillRepository.findByProjectIdAndSkillName(projectId, normalizedSkillName);

            if (existingSkill.isEmpty()) {
                ProjectRequiredSkill projectSkill = ProjectRequiredSkill.builder()
                    .projectId(projectId)
                    .skillName(normalizedSkillName)
                    .skillType(determineSkillType(normalizedSkillName))
                    .requiredLevel(requiredLevel)
                    .isRequired(true)
                    .build();

                projectRequiredSkillRepository.save(projectSkill);
                log.info("Added required skill '{}' (level: {}) to project: {}",
                        normalizedSkillName, requiredLevel, projectId);
            } else {
                // Update if current required level is lower than new requirement
                ProjectRequiredSkill existing = existingSkill.get();
                if (requiredLevel.ordinal() > existing.getRequiredLevel().ordinal()) {
                    existing.setRequiredLevel(requiredLevel);
                    existing.setUpdatedAt(LocalDateTime.now());
                    projectRequiredSkillRepository.save(existing);
                    log.info("Updated skill '{}' level from {} to {} for project: {}",
                            normalizedSkillName, existing.getRequiredLevel(), requiredLevel, projectId);
                }
            }
        }
    }

    /**
     * Add a member to the project when assigned to a task
     */
    @Transactional
    public void addProjectMemberFromTaskAssignment(String projectId, String userId) {
        if (projectId == null || userId == null) {
            log.warn("Invalid project ID or user ID provided: projectId={}, userId={}", projectId, userId);
            return;
        }

        // Check if user is already an active member of the project
        if (projectMemberRepository.existsByProjectIdAndUserIdAndIsActive(projectId, userId, true)) {
            log.debug("User {} is already an active member of project: {}", userId, projectId);
            return;
        }

        // Add user as a project member
        ProjectMember projectMember = ProjectMember.builder()
            .projectId(projectId)
            .userId(userId)
            .role(ProjectRole.MEMBER) // Default role for task assignees
            .isActive(true)
            .build();

        projectMemberRepository.save(projectMember);
        log.info("Added user {} as member to project: {}", userId, projectId);
    }

    /**
     * Determine skill type based on skill name
     */
    private SkillType determineSkillType(String skillName) {
        if (skillName == null) {
            return SkillType.OTHER;
        }

        String lowerSkillName = skillName.toLowerCase();

        // Programming languages
        if (lowerSkillName.matches(".*(java|python|javascript|typescript|c\\+\\+|c#|php|ruby|go|kotlin|swift|scala|rust).*")) {
            return SkillType.PROGRAMMING_LANGUAGE;
        }

        // Frameworks
        if (lowerSkillName.matches(".*(spring|react|angular|vue|django|flask|express|laravel|rails|hibernate|jpa).*")) {
            return SkillType.FRAMEWORK;
        }

        // Databases
        if (lowerSkillName.matches(".*(mysql|postgresql|mongodb|redis|elasticsearch|oracle|sql server|sqlite|cassandra).*")) {
            return SkillType.DATABASE;
        }

        // Cloud platforms
        if (lowerSkillName.matches(".*(aws|azure|gcp|google cloud|amazon|docker|kubernetes|heroku).*")) {
            return SkillType.CLOUD_PLATFORM;
        }

        // DevOps tools
        if (lowerSkillName.matches(".*(jenkins|gitlab|github|docker|kubernetes|terraform|ansible|chef|puppet).*")) {
            return SkillType.DEVOPS_TOOL;
        }

        // Testing tools
        if (lowerSkillName.matches(".*(junit|testng|selenium|cypress|jest|mocha|postman|jmeter).*")) {
            return SkillType.TESTING_TOOL;
        }

        // Frontend technologies
        if (lowerSkillName.matches(".*(html|css|sass|scss|bootstrap|tailwind|webpack|npm|yarn).*")) {
            return SkillType.FRONTEND_TECHNOLOGY;
        }

        // Mobile development
        if (lowerSkillName.matches(".*(android|ios|flutter|react native|xamarin|ionic).*")) {
            return SkillType.MOBILE_DEVELOPMENT;
        }

        // API technologies
        if (lowerSkillName.matches(".*(rest|graphql|soap|api|microservices|grpc).*")) {
            return SkillType.API_TECHNOLOGY;
        }

        // Architecture and design
        if (lowerSkillName.matches(".*(architecture|design pattern|microservices|system design|uml).*")) {
            return SkillType.ARCHITECTURE;
        }

        // Project management
        if (lowerSkillName.matches(".*(project management|scrum|agile|kanban|jira|confluence).*")) {
            return SkillType.PROJECT_MANAGEMENT;
        }

        // Soft skills
        if (lowerSkillName.matches(".*(communication|leadership|teamwork|problem solving|critical thinking).*")) {
            return SkillType.SOFT_SKILL;
        }

        // Default to OTHER
        return SkillType.OTHER;
    }

    /**
     * Convert proficiency score (0-1) to ProficiencyLevel enum
     */
    private ProficiencyLevel convertScoreToProficiencyLevel(Double score) {
        if (score == null) {
            return ProficiencyLevel.INTERMEDIATE;
        }

        if (score >= 0.9) {
            return ProficiencyLevel.MASTER;
        } else if (score >= 0.7) {
            return ProficiencyLevel.EXPERT;
        } else if (score >= 0.5) {
            return ProficiencyLevel.ADVANCED;
        } else if (score >= 0.3) {
            return ProficiencyLevel.INTERMEDIATE;
        } else {
            return ProficiencyLevel.BEGINNER;
        }
    }

    /**
     * Get all required skills for a project
     */
    public List<ProjectRequiredSkill> getProjectRequiredSkills(String projectId) {
        return projectRequiredSkillRepository.findByProjectId(projectId);
    }

    /**
     * Get all active members of a project
     */
    public List<ProjectMember> getActiveProjectMembers(String projectId) {
        return projectMemberRepository.findByProjectIdAndIsActive(projectId, true);
    }
}
