package com.mnp.project.client;

import com.mnp.project.dto.response.TaskDto;
import com.mnp.project.configuration.FeignConfiguration;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "task-service", url = "${app.services.task}", configuration = FeignConfiguration.class)
public interface TaskServiceClient {

    @GetMapping("/internal/tasks/project/{projectId}")
    List<TaskDto> getTasksByProjectId(@PathVariable("projectId") String projectId);

    @GetMapping("/tasks")
    List<TaskDto> getTasksByProjectIdFallback(@RequestParam("projectId") String projectId);
}
