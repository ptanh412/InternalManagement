package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.request.AddProjectMemberRequest;
import com.mnp.task.dto.request.UpdateProjectSkillsRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "project-service", url = "${app.services.project:http://localhost:8090}", configuration = FeignClientConfiguration.class)
public interface ProjectServiceClient {

    @PutMapping("/internal/projects/{projectId}/tasks/increment")
    void incrementTotalTasks(@PathVariable("projectId") String projectId);

    @PutMapping("/internal/projects/{projectId}/skills")
    void updateProjectSkills(@PathVariable("projectId") String projectId, @RequestBody UpdateProjectSkillsRequest request);

    @PostMapping("/internal/projects/members")
    void addMemberToProject(@RequestBody AddProjectMemberRequest request);

    @GetMapping("/projects/team-lead/{teamLeadId}")
    java.util.List<com.mnp.task.dto.response.ProjectResponse> getProjectsByTeamLead(@PathVariable("teamLeadId") String teamLeadId);

    @GetMapping("/projects/{projectId}")
    com.mnp.task.dto.response.ProjectResponse getProjectById(@PathVariable("projectId") String projectId);
}
