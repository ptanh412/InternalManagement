package com.mnp.task.controller;

import com.mnp.task.dto.request.*;
import com.mnp.task.dto.response.TaskDependencyResponse;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.dto.response.TaskSkillResponse;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.service.TaskService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskController {

    TaskService taskService;

    // Basic CRUD operations
    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody TaskCreationRequest request) {
        return ResponseEntity.ok(taskService.createTask(request));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable String taskId,
            @Valid @RequestBody TaskUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable String taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{taskId}")
    public ResponseEntity<TaskResponse> getTask(@PathVariable String taskId) {
        return ResponseEntity.ok(taskService.getTask(taskId));
    }

    // Task listing with role-based filtering
    @GetMapping
    public ResponseEntity<List<TaskResponse>> getAllTasks(
            @RequestParam(required = false) String projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) String assigneeId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userRole) {

        if (userId != null && userRole != null) {
            return ResponseEntity.ok(taskService.getTasksForUser(userId, userRole));
        } else if (projectId != null || status != null || assigneeId != null) {
            return ResponseEntity.ok(taskService.getAllTasks(projectId, status, assigneeId));
        } else {
            return ResponseEntity.ok(taskService.getAllTasks());
        }
    }

    @GetMapping("/team-lead/{teamLeadId}")
    public ResponseEntity<List<TaskResponse>> getTasksByTeamLead(@PathVariable String teamLeadId) {
        return ResponseEntity.ok(taskService.getTasksForTeamLead(teamLeadId));
    }

    // Task workflow endpoints
    @PutMapping("/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable String taskId,
            @Valid @RequestBody TaskStatusUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTaskStatus(taskId, request));
    }

    @PutMapping("/{taskId}/assign/{userId}")
    public ResponseEntity<TaskResponse> assignTask(
            @PathVariable String taskId,
            @PathVariable String userId) {
        return ResponseEntity.ok(taskService.assignTask(taskId, userId));
    }

    @PutMapping("/{taskId}/progress")
    public ResponseEntity<TaskResponse> updateTaskProgress(
            @PathVariable String taskId,
            @Valid @RequestBody TaskProgressUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateTaskProgress(taskId, request));
    }

    // Task dependencies endpoints
    @GetMapping("/{taskId}/dependencies")
    public ResponseEntity<List<TaskDependencyResponse>> getTaskDependencies(@PathVariable String taskId) {
        return ResponseEntity.ok(taskService.getTaskDependencies(taskId));
    }

    @PostMapping("/{taskId}/dependencies")
    public ResponseEntity<TaskDependencyResponse> addTaskDependency(
            @PathVariable String taskId,
            @Valid @RequestBody TaskDependencyRequest request) {
        return ResponseEntity.ok(taskService.addTaskDependency(taskId, request));
    }

    @DeleteMapping("/{taskId}/dependencies/{dependencyId}")
    public ResponseEntity<Void> removeTaskDependency(
            @PathVariable String taskId,
            @PathVariable String dependencyId) {
        taskService.removeTaskDependency(taskId, dependencyId);
        return ResponseEntity.noContent().build();
    }

    // Task skills endpoints
    @GetMapping("/{taskId}/skills")
    public ResponseEntity<List<TaskSkillResponse>> getTaskSkills(@PathVariable String taskId) {
        return ResponseEntity.ok(taskService.getTaskSkills(taskId));
    }

    @PostMapping("/{taskId}/skills")
    public ResponseEntity<TaskSkillResponse> addTaskSkill(
            @PathVariable String taskId,
            @Valid @RequestBody TaskSkillRequest request) {
        return ResponseEntity.ok(taskService.addTaskSkill(taskId, request));
    }

    @DeleteMapping("/{taskId}/skills/{skillId}")
    public ResponseEntity<Void> removeTaskSkill(
            @PathVariable String taskId,
            @PathVariable String skillId) {
        taskService.removeTaskSkill(taskId, skillId);
        return ResponseEntity.noContent().build();
    }

    // Task submission endpoints
    @PostMapping("/{taskId}/submit")
    public ResponseEntity<TaskSubmissionResponse> submitTask(
            @PathVariable String taskId,
            @Valid @RequestBody TaskSubmissionRequest request) {
        return ResponseEntity.ok(taskService.submitTask(taskId, request));
    }

    @GetMapping("/{taskId}/submissions")
    public ResponseEntity<List<TaskSubmissionResponse>> getTaskSubmissions(@PathVariable String taskId) {
        return ResponseEntity.ok(taskService.getTaskSubmissions(taskId));
    }

    @GetMapping("/assigned/{userId}")
    public ResponseEntity<List<TaskResponse>> getTasksAssignedToUser(@PathVariable String userId) {
        return ResponseEntity.ok(taskService.getTasksByAssignee(userId));
    }

    @GetMapping("/my-tasks")
    public ResponseEntity<List<TaskResponse>> getMyAssignedTasks() {
        return ResponseEntity.ok(taskService.getMyTasks());
    }
}
