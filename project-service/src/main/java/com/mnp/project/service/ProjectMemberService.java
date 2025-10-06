package com.mnp.project.service;

import com.mnp.project.dto.response.ProjectMemberResponse;
import com.mnp.project.dto.request.AddProjectMemberRequest;
import com.mnp.project.dto.request.UpdateProjectMemberRequest;
import com.mnp.project.entity.ProjectMember;
import com.mnp.project.enums.ProjectRole;
import com.mnp.project.exception.AppException;
import com.mnp.project.exception.ErrorCode;
import com.mnp.project.repository.ProjectMemberRepository;
import com.mnp.project.repository.ProjectRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectMemberService {

    ProjectMemberRepository projectMemberRepository;
    ProjectRepository projectRepository;
    NotificationProducerService notificationProducerService;

    @Transactional
    public ProjectMemberResponse addMemberToProject(AddProjectMemberRequest request) {
        // Verify project exists
        var project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        // Check if user is already a member of the project
        if (projectMemberRepository.existsByProjectIdAndUserIdAndIsActive(
                request.getProjectId(), request.getUserId(), true)) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        ProjectMember projectMember = ProjectMember.builder()
                .projectId(request.getProjectId())
                .userId(request.getUserId())
                .role(request.getRole() != null ? request.getRole() : ProjectRole.MEMBER)
                .isActive(true)
                .build();

        ProjectMember savedMember = projectMemberRepository.save(projectMember);

        // Send notification if the member is being added as TEAM_LEAD
        if (ProjectRole.TEAM_LEAD.equals(savedMember.getRole())) {
            try {
                String currentUserName = getCurrentUserName();
                notificationProducerService.sendTeamLeadProjectNotification(
                    savedMember.getUserId(),
                    project.getId(),
                    project.getName(),
                    currentUserName
                );
                log.info("Sent team lead notification for user {} added to project {}",
                    savedMember.getUserId(), project.getId());
            } catch (Exception e) {
                log.error("Failed to send team lead notification for user {} on project {}",
                    savedMember.getUserId(), project.getId(), e);
            }
        }

        return mapToProjectMemberResponse(savedMember);
    }

    @Transactional
    public void removeMemberFromProject(String projectId, String userId) {
        ProjectMember projectMember = projectMemberRepository
                .findByProjectIdAndUserIdAndIsActive(projectId, userId, true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Soft delete - mark as inactive
        projectMember.setActive(false);
        projectMember.setLeftAt(LocalDateTime.now());
        projectMemberRepository.save(projectMember);
    }

    public ProjectMemberResponse updateMemberRole(String projectId, String userId, UpdateProjectMemberRequest request) {
        ProjectMember projectMember = projectMemberRepository
                .findByProjectIdAndUserIdAndIsActive(projectId, userId, true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        ProjectRole oldRole = projectMember.getRole();

        if (request.getRole() != null) {
            projectMember.setRole(request.getRole());
        }

        ProjectMember updatedMember = projectMemberRepository.save(projectMember);

        // Send notification if the user is being promoted to TEAM_LEAD
        if (!ProjectRole.TEAM_LEAD.equals(oldRole) && ProjectRole.TEAM_LEAD.equals(updatedMember.getRole())) {
            try {
                var project = projectRepository.findById(projectId)
                        .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

                String currentUserName = getCurrentUserName();
                notificationProducerService.sendTeamLeadProjectNotification(
                    updatedMember.getUserId(),
                    project.getId(),
                    project.getName(),
                    currentUserName
                );
                log.info("Sent team lead promotion notification for user {} on project {}",
                    updatedMember.getUserId(), project.getId());
            } catch (Exception e) {
                log.error("Failed to send team lead promotion notification for user {} on project {}",
                    updatedMember.getUserId(), projectId, e);
            }
        }

        return mapToProjectMemberResponse(updatedMember);
    }

    private String getCurrentUserName() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    public List<ProjectMemberResponse> getProjectMembers(String projectId) {
        return projectMemberRepository.findByProjectIdAndIsActive(projectId, true)
                .stream()
                .map(this::mapToProjectMemberResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectMemberResponse> getUserProjects(String userId) {
        return projectMemberRepository.findByUserIdAndIsActive(userId, true)
                .stream()
                .map(this::mapToProjectMemberResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectMemberResponse> getProjectMembersByRole(String projectId, ProjectRole role) {
        return projectMemberRepository.findByProjectIdAndRoleAndIsActive(projectId, role, true)
                .stream()
                .map(this::mapToProjectMemberResponse)
                .collect(Collectors.toList());
    }

    public ProjectMemberResponse getProjectMember(String projectId, String userId) {
        ProjectMember projectMember = projectMemberRepository
                .findByProjectIdAndUserIdAndIsActive(projectId, userId, true)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return mapToProjectMemberResponse(projectMember);
    }

    public Long getProjectMemberCount(String projectId) {
        return projectMemberRepository.countActiveMembers(projectId);
    }

    public boolean isUserMemberOfProject(String projectId, String userId) {
        return projectMemberRepository.existsByProjectIdAndUserIdAndIsActive(projectId, userId, true);
    }

    // Helper method
    private ProjectMemberResponse mapToProjectMemberResponse(ProjectMember projectMember) {
        return ProjectMemberResponse.builder()
                .id(projectMember.getId())
                .projectId(projectMember.getProjectId())
                .userId(projectMember.getUserId())
                .role(projectMember.getRole())
                .joinedAt(projectMember.getJoinedAt())
                .leftAt(projectMember.getLeftAt())
                .isActive(projectMember.isActive())
                .build();
    }
}
