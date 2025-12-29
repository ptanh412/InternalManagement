package com.mnp.ai.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
        name = "project-service",
        url = "${app.services.project}")
public interface ProjectClient {
    @GetMapping("/internal/projects/{projectId}/{teamLeadId}")
    Boolean isTeamLead(@PathVariable String projectId, @PathVariable String teamLeadId);
}
