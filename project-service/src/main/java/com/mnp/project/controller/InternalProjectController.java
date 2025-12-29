package com.mnp.project.controller;

import com.mnp.project.dto.request.AddProjectMemberRequest;
import com.mnp.project.dto.request.ApiResponse;
import com.mnp.project.dto.request.UpdateProjectSkillsRequest;
import com.mnp.project.dto.response.ProjectMemberResponse;
import com.mnp.project.dto.response.ProjectResponse;
import com.mnp.project.service.ProjectMemberService;
import com.mnp.project.service.ProjectService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/internal/projects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class InternalProjectController {

    ProjectService projectService;
    ProjectMemberService projectMemberService;

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> getProjectById(@PathVariable String id) {
        return ApiResponse.<ProjectResponse>builder()
                .result(projectService.getProjectById(id))
                .build();
    }
    @GetMapping("/member/{projectId}")
    public ApiResponse<List<ProjectMemberResponse>> getProjectMembers(@PathVariable String projectId) {
        log.info("Getting all members for project {}", projectId);
        return ApiResponse.<List<ProjectMemberResponse>>builder()
                .result(projectMemberService.getProjectMembers(projectId))
                .build();
    }
    /**
     * Internal endpoint for task-service to increment total tasks count
     * This endpoint doesn't require authentication for inter-service communication
     */
    @PutMapping("/{projectId}/tasks/increment")
    public ApiResponse<Void> incrementTotalTasks(@PathVariable String projectId) {
        log.info("Internal call: Incrementing total tasks for project {}", projectId);
        projectService.incrementTotalTasks(projectId);
        return ApiResponse.<Void>builder()
                .message("Total tasks incremented successfully")
                .build();
    }

    /**
     * Internal endpoint for task-service to add project members
     * This endpoint doesn't require authentication for inter-service communication
     */
    @PostMapping("/members")
    public ApiResponse<Void> addMemberToProject(@RequestBody AddProjectMemberRequest request) {
        log.info("Internal call: Adding member {} to project {}", request.getUserId(), request.getProjectId());
        try {
            projectMemberService.addMemberToProject(request);
        } catch (Exception e) {
            log.warn("Member {} may already exist in project {} or other issue: {}", request.getUserId(), request.getProjectId(), e.getMessage());
            // Don't fail the task creation if member addition fails
        }
        return ApiResponse.<Void>builder()
                .message("Member added to project successfully")
                .build();
    }

    @GetMapping("/{projectId}/{teamLeadId}")
    public ApiResponse<Boolean> teamLeadInProject(@PathVariable String projectId, @PathVariable String teamLeadId) {
        try{
            Boolean exists = projectService.teamLeadHasProjects(teamLeadId, projectId);
            return ApiResponse.<Boolean>builder().result(exists).build();
        }catch(Exception e){
            return ApiResponse.<Boolean>builder().result(false).build();
        }
    }
}
