package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.request.AddProjectMemberRequest;
import com.mnp.task.dto.request.UpdateProjectSkillsRequest;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.dto.response.ProjectResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "project-service", url = "${app.services.project}", configuration = FeignClientConfiguration.class)
public interface ProjectServiceClient {

    @PutMapping("/projects/{projectId}/tasks/increment")
    void incrementTotalTasks(@PathVariable("projectId") String projectId);

    @PutMapping("/projects/{projectId}/tasks/decrement")
    void decrementTotalTasks(@PathVariable("projectId") String projectId);

    @PutMapping("/projects/{projectId}/tasks/completed/increment")
    void incrementCompletedTasks(@PathVariable("projectId") String projectId);

    @PutMapping("/projects/{projectId}/tasks/completed/decrement")
    void decrementCompletedTasks(@PathVariable("projectId") String projectId);

    @PutMapping("/internal/projects/{projectId}/skills")
    void updateProjectSkills(@PathVariable("projectId") String projectId, @RequestBody UpdateProjectSkillsRequest request);

    @PostMapping("/internal/projects/members")
    void addMemberToProject(@RequestBody AddProjectMemberRequest request);

    @GetMapping("/projects/team-lead/{teamLeadId}")
    com.mnp.task.dto.response.ApiResponse<java.util.List<com.mnp.task.dto.response.ProjectResponse>> getProjectsByTeamLead(@PathVariable("teamLeadId") String teamLeadId);

    @GetMapping("/projects/{projectId}")
    com.mnp.task.dto.response.ApiResponse<com.mnp.task.dto.response.ProjectResponse> getProjectById(@PathVariable("projectId") String projectId);

    @GetMapping("/project-members/projects/{projectId}/users/{userId}/exists")
    ApiResponse<Boolean> isUserInProject(@PathVariable("projectId") String projectId, @PathVariable("userId") String userId);

    @GetMapping("/projects/{projectId}")
    ApiResponse<ProjectResponse> getProjectName(@PathVariable("projectId") String projectId);
}
