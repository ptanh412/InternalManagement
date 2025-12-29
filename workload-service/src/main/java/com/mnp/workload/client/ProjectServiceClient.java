package com.mnp.workload.client;

import com.mnp.workload.dto.response.ApiResponseDTO;
import com.mnp.workload.dto.response.ProjectMemberResponseDTO;
import com.mnp.workload.dto.response.ProjectResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import com.mnp.workload.configuration.FeignConfiguration;


import java.util.List;

@FeignClient(name = "project-service", url = "${app.services.project}", configuration = FeignConfiguration.class)
public interface ProjectServiceClient {

    /**
     * Get all members of a project
     */
    @GetMapping("/internal/projects/member/{projectId}")
    ApiResponseDTO<List<ProjectMemberResponseDTO>> getProjectMembers(@PathVariable("projectId") String projectId);

    /**
     * Get project information by ID
     */
    @GetMapping("/projects/{projectId}")
    ApiResponseDTO<ProjectResponseDTO> getProjectById(@PathVariable("projectId") String projectId);
}
