package com.mnp.ai.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import com.mnp.ai.dto.ApiResponse;
import com.mnp.ai.dto.TaskResponse;
import com.mnp.ai.dto.TaskMetricsResponse;

@FeignClient(
        name = "task-service",
        url = "${app.services.task:http://localhost:8088/task}",
        fallback = TaskServiceFallback.class)
public interface TaskServiceClient {

    @GetMapping("/internal/tasks/{taskId}")
    TaskResponse getTask(@PathVariable String taskId);

    @GetMapping("/internal/tasks/user/{userId}")
    List<TaskResponse> getTasksByUser(@PathVariable String userId, @RequestParam(defaultValue = "10") int limit);

    @GetMapping("/internal/tasks/history/{userId}")
    List<TaskResponse> getTaskHistory(@PathVariable String userId, @RequestParam(defaultValue = "20") int limit);

    @GetMapping("/internal/tasks/type/{taskType}")
    List<TaskResponse> getTasksByType(@PathVariable String taskType);

    @PostMapping("/internal/tasks")
    TaskResponse createTask(@RequestBody Object taskRequest);

    @GetMapping("/internal/users/{userId}/metrics")
    ApiResponse<TaskMetricsResponse> getUserTaskMetrics(@PathVariable String userId);
}
