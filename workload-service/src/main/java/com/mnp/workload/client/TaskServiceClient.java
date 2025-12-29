package com.mnp.workload.client;

import com.mnp.workload.dto.response.TaskResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "task-service", url = "${app.services.task.url}")
public interface TaskServiceClient {

    /**
     * Get all tasks assigned to a specific user
     */
    @GetMapping("/internal/tasks/user/{userId}")
    List<TaskResponseDTO> getTasksByUser(
            @PathVariable("userId") String userId,
            @RequestParam(value = "limit", defaultValue = "1000") int limit
    );

    /**
     * Get task history created by a user
     */
    @GetMapping("/internal/tasks/history/{userId}")
    List<TaskResponseDTO> getTaskHistory(
            @PathVariable("userId") String userId,
            @RequestParam(value = "limit", defaultValue = "1000") int limit
    );

    /**
     * Get a single task by ID
     */
    @GetMapping("/internal/tasks/{taskId}")
    TaskResponseDTO getTask(@PathVariable("taskId") String taskId);

    /**
     * Get all tasks for a project
     */
    @GetMapping("/internal/tasks/project/{projectId}")
    List<TaskResponseDTO> getTasksByProject(@PathVariable("projectId") String projectId);
}
