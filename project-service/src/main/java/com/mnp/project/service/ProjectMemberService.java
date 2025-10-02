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

    @Transactional
    public ProjectMemberResponse addMemberToProject(AddProjectMemberRequest request) {
        // Verify project exists
        if (!projectRepository.existsById(request.getProjectId())) {
            throw new AppException(ErrorCode.PROJECT_NOT_EXISTED);
        }

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

        if (request.getRole() != null) {
            projectMember.setRole(request.getRole());
        }

        ProjectMember updatedMember = projectMemberRepository.save(projectMember);
        return mapToProjectMemberResponse(updatedMember);
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
