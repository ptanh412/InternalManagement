package com.mnp.task.controller;

import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.service.TaskService;
import com.mnp.task.service.TaskMetricsService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InternalTaskController {

    TaskService taskService;
    TaskMetricsService taskMetricsService;

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable String taskId) {
        log.info("Internal request: Getting task with ID: {}", taskId);
        return ResponseEntity.ok(taskService.getTask(taskId));
    }

    @GetMapping("/tasks/user/{userId}")
    public ResponseEntity<List<TaskResponse>> getTasksByUser(
            @PathVariable String userId,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Internal request: Getting tasks for user: {} with limit: {}", userId, limit);
        List<TaskResponse> tasks = taskService.getTasksByAssignee(userId);
        // Apply limit if needed
        if (tasks.size() > limit) {
            tasks = tasks.subList(0, limit);
        }
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/history/{userId}")
    public ResponseEntity<List<TaskResponse>> getTaskHistory(
            @PathVariable String userId,
            @RequestParam(defaultValue = "20") int limit) {
        log.info("Internal request: Getting task history for user: {} with limit: {}", userId, limit);
        List<TaskResponse> tasks = taskService.getTasksByCreator(userId);
        // Apply limit if needed
        if (tasks.size() > limit) {
            tasks = tasks.subList(0, limit);
        }
        return ResponseEntity.ok(tasks);
    }

    @GetMapping("/tasks/project/{projectId}")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable String projectId) {
        try {
            log.info("Internal request: Getting tasks for project: {}", projectId);
            List<TaskResponse> tasks = taskService.getAllTasks(projectId, null, null);
            log.info("Successfully retrieved {} tasks for project: {}", tasks.size(), projectId);
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            log.error("Error getting tasks for project {}: {}", projectId, e.getMessage(), e);
            return ResponseEntity.ok(List.of()); // Return empty list instead of error
        }
    }

    @GetMapping("/tasks/all")
    public ResponseEntity<List<TaskResponse>> getAllTasks() {
        log.info("Internal request: Getting all tasks");
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    /**
     * Get task performance metrics for a user (used by identity service)
     */
    @GetMapping("/users/{userId}/metrics")
    public ResponseEntity<ApiResponse<TaskMetricsService.TaskMetricsResponse>> getUserTaskMetrics(
            @PathVariable String userId) {
        log.info("Internal request: Getting task metrics for user: {}", userId);
        
        TaskMetricsService.TaskMetricsResponse metrics = taskMetricsService.calculateUserTaskMetrics(userId);
        
        return ResponseEntity.ok(
            ApiResponse.<TaskMetricsService.TaskMetricsResponse>builder()
                .result(metrics)
                .build()
        );
    }
}
