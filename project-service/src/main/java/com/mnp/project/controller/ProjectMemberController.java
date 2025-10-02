package com.mnp.project.controller;

import com.mnp.project.dto.response.ProjectMemberResponse;
import com.mnp.project.dto.request.AddProjectMemberRequest;
import com.mnp.project.dto.request.ApiResponse;
import com.mnp.project.dto.request.UpdateProjectMemberRequest;
import com.mnp.project.enums.ProjectRole;
import com.mnp.project.service.ProjectMemberService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/project-members")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectMemberController {

    ProjectMemberService projectMemberService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectMemberResponse> addMemberToProject(@Valid @RequestBody AddProjectMemberRequest request) {
        log.info("Adding member {} to project {}", request.getUserId(), request.getProjectId());
        return ApiResponse.<ProjectMemberResponse>builder()
                .result(projectMemberService.addMemberToProject(request))
                .build();
    }

    @DeleteMapping("/projects/{projectId}/users/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> removeMemberFromProject(
            @PathVariable String projectId,
            @PathVariable String userId) {
        log.info("Removing member {} from project {}", userId, projectId);
        projectMemberService.removeMemberFromProject(projectId, userId);
        return ApiResponse.<Void>builder()
                .message("Member removed from project successfully")
                .build();
    }

    @PutMapping("/projects/{projectId}/users/{userId}")
    public ApiResponse<ProjectMemberResponse> updateMemberRole(
            @PathVariable String projectId,
            @PathVariable String userId,
            @RequestBody UpdateProjectMemberRequest request) {
        log.info("Updating role for member {} in project {}", userId, projectId);
        return ApiResponse.<ProjectMemberResponse>builder()
                .result(projectMemberService.updateMemberRole(projectId, userId, request))
                .build();
    }

    @GetMapping("/projects/{projectId}")
    public ApiResponse<List<ProjectMemberResponse>> getProjectMembers(@PathVariable String projectId) {
        log.info("Getting all members for project {}", projectId);
        return ApiResponse.<List<ProjectMemberResponse>>builder()
                .result(projectMemberService.getProjectMembers(projectId))
                .build();
    }

    @GetMapping("/users/{userId}")
    public ApiResponse<List<ProjectMemberResponse>> getUserProjects(@PathVariable String userId) {
        log.info("Getting all projects for user {}", userId);
        return ApiResponse.<List<ProjectMemberResponse>>builder()
                .result(projectMemberService.getUserProjects(userId))
                .build();
    }

    @GetMapping("/projects/{projectId}/roles/{role}")
    public ApiResponse<List<ProjectMemberResponse>> getProjectMembersByRole(
            @PathVariable String projectId,
            @PathVariable ProjectRole role) {
        log.info("Getting members with role {} for project {}", role, projectId);
        return ApiResponse.<List<ProjectMemberResponse>>builder()
                .result(projectMemberService.getProjectMembersByRole(projectId, role))
                .build();
    }

    @GetMapping("/projects/{projectId}/users/{userId}")
    public ApiResponse<ProjectMemberResponse> getProjectMember(
            @PathVariable String projectId,
            @PathVariable String userId) {
        log.info("Getting member {} details for project {}", userId, projectId);
        return ApiResponse.<ProjectMemberResponse>builder()
                .result(projectMemberService.getProjectMember(projectId, userId))
                .build();
    }

    @GetMapping("/projects/{projectId}/count")
    public ApiResponse<Long> getProjectMemberCount(@PathVariable String projectId) {
        log.info("Getting member count for project {}", projectId);
        return ApiResponse.<Long>builder()
                .result(projectMemberService.getProjectMemberCount(projectId))
                .build();
    }

    @GetMapping("/projects/{projectId}/users/{userId}/exists")
    public ApiResponse<Boolean> isUserMemberOfProject(
            @PathVariable String projectId,
            @PathVariable String userId) {
        log.info("Checking if user {} is member of project {}", userId, projectId);
        return ApiResponse.<Boolean>builder()
                .result(projectMemberService.isUserMemberOfProject(projectId, userId))
                .build();
    }
}
