package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.request.AddProjectMemberRequest;
import com.mnp.task.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "project-integration-service", url = "${app.services.project}", configuration = FeignClientConfiguration.class)
public interface ProjectIntegrationClient {

    @PutMapping("/internal/projects/{projectId}/skills")
    ApiResponse<Void> updateProjectSkillsFromTask(
            @PathVariable("projectId") String projectId,
            @RequestBody List<String> requiredSkills);

    @PutMapping("/internal/projects/{projectId}/skills")
    ApiResponse<Void> updateProjectSkillsFromTaskMap(
            @PathVariable("projectId") String projectId,
            @RequestBody Map<String, Double> requiredSkillsMap);

    @PostMapping("/internal/projects/members")
    ApiResponse<Void> addProjectMemberFromTaskAssignment(
            @RequestBody AddProjectMemberRequest request);
}
