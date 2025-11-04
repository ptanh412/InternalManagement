package com.mnp.workload.controller;

import com.mnp.workload.dto.request.*;
import com.mnp.workload.dto.response.*;
import com.mnp.workload.dto.request.AddTaskToWorkloadRequest;
import com.mnp.workload.dto.request.UpdateCapacityRequest;
import com.mnp.workload.dto.request.UpdateTaskWorkloadRequest;
import com.mnp.workload.dto.response.*;
import com.mnp.workload.service.WorkloadService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/workloads")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserWorkloadController {

    WorkloadService workloadService;

    // GET /api/workloads/{userId} - Get user's current workload & capacity
    @GetMapping("/{userId}")
    public ResponseEntity<UserWorkloadResponse> getUserWorkload(@PathVariable String userId) {
        UserWorkloadResponse response = workloadService.getUserWorkload(userId);
        return ResponseEntity.ok(response);
    }

    // PUT /api/workloads/{userId}/capacity - Update user capacity (hours/week)
    @PutMapping("/{userId}/capacity")
    public ResponseEntity<UserWorkloadResponse> updateUserCapacity(
            @PathVariable String userId,
            @Valid @RequestBody UpdateCapacityRequest request) {
        UserWorkloadResponse response = workloadService.updateUserCapacity(userId, request);
        return ResponseEntity.ok(response);
    }

    // GET /api/workloads/{userId}/availability - Check user availability for new tasks
    @GetMapping("/{userId}/availability")
    public ResponseEntity<UserAvailabilityResponse> getUserAvailability(@PathVariable String userId) {
        UserAvailabilityResponse response = workloadService.getUserAvailability(userId);
        return ResponseEntity.ok(response);
    }

    // GET /api/workloads/team/{departmentId} - Team workload overview
    @GetMapping("/team/{departmentId}")
    public ResponseEntity<TeamWorkloadResponse> getTeamWorkload(@PathVariable String departmentId) {
        TeamWorkloadResponse response = workloadService.getTeamWorkload(departmentId);
        return ResponseEntity.ok(response);
    }

    // GET /api/workloads/available - Get available users for assignment
    @GetMapping("/available")
    public ResponseEntity<AvailableUsersResponse> getAvailableUsers() {
        AvailableUsersResponse response = workloadService.getAvailableUsers();
        return ResponseEntity.ok(response);
    }

    // POST /api/workloads/optimize/{projectId} - Suggest workload rebalancing for project
    @PostMapping("/optimize/{projectId}")
    public ResponseEntity<WorkloadOptimizationResponse> optimizeWorkloadForProject(@PathVariable String projectId) {
        WorkloadOptimizationResponse response = workloadService.optimizeWorkloadForProject(projectId);
        return ResponseEntity.ok(response);
    }

    // POST /api/workloads/tasks - Add task to user workload (when assigned)
    @PostMapping("/tasks")
    public ResponseEntity<UserCurrentTaskResponse> addTaskToWorkload(
            @RequestParam String userId,
            @Valid @RequestBody AddTaskToWorkloadRequest request) {
        UserCurrentTaskResponse response = workloadService.addTaskToWorkload(userId, request);
        return ResponseEntity.ok(response);
    }

    // PUT /api/workloads/tasks/{taskId} - Update task hours/progress
    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<UserCurrentTaskResponse> updateTaskWorkload(
            @PathVariable String taskId,
            @Valid @RequestBody UpdateTaskWorkloadRequest request) {
        UserCurrentTaskResponse response = workloadService.updateTaskWorkload(taskId, request);
        return ResponseEntity.ok(response);
    }

    // DELETE /api/workloads/tasks/{taskId} - Remove task from workload (when completed)
    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> removeTaskFromWorkload(@PathVariable String taskId) {
        workloadService.removeTaskFromWorkload(taskId);
        return ResponseEntity.noContent().build();
    }
}
