package com.mnp.project.controller;

import com.mnp.project.dto.response.ProjectAnalyticsResponse;
import com.mnp.project.dto.response.ProjectProgressResponse;
import com.mnp.project.dto.response.ProjectResponse;
import com.mnp.project.dto.response.ProjectSummaryResponse;
import com.mnp.project.dto.request.ApiResponse;
import com.mnp.project.dto.request.CreateProjectRequest;
import com.mnp.project.dto.request.UpdateProjectRequest;
import com.mnp.project.dto.request.UpdateProjectSkillsRequest;
import com.mnp.project.enums.ProjectStatus;
import com.mnp.project.service.ProjectService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectController {

    ProjectService projectService;

    @GetMapping
    public ApiResponse<List<ProjectResponse>> getAllProjects() {
        return ApiResponse.<List<ProjectResponse>>builder()
                .result(projectService.getAllProjects())
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> getProjectById(@PathVariable String id) {
        return ApiResponse.<ProjectResponse>builder()
                .result(projectService.getProjectById(id))
                .build();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ProjectResponse> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ApiResponse.<ProjectResponse>builder()
                .result(projectService.createProject(request))
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<ProjectResponse> updateProject(
            @PathVariable String id,
            @RequestBody UpdateProjectRequest request) {
        return ApiResponse.<ProjectResponse>builder()
                .result(projectService.updateProject(id, request))
                .build();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id);
        return ApiResponse.<Void>builder()
                .message("Project deleted successfully")
                .build();
    }

    @PatchMapping("/{id}/status")
    public ApiResponse<ProjectResponse> updateProjectStatus(
            @PathVariable String id,
            @RequestParam ProjectStatus status) {
        return ApiResponse.<ProjectResponse>builder()
                .result(projectService.updateProjectStatus(id, status))
                .build();
    }

    @GetMapping("/{id}/progress")
    public ApiResponse<ProjectProgressResponse> getProjectProgress(@PathVariable String id) {
        return ApiResponse.<ProjectProgressResponse>builder()
                .result(projectService.getProjectProgress(id))
                .build();
    }

    @PutMapping("/{id}/progress/calculate")
    public ApiResponse<Double> calculateProjectProgress(@PathVariable String id) {
        return ApiResponse.<Double>builder()
                .result(projectService.calculateProjectProgress(id))
                .build();
    }

    @GetMapping("/status/{status}")
    public ApiResponse<List<ProjectResponse>> getProjectsByStatus(@PathVariable ProjectStatus status) {
        return ApiResponse.<List<ProjectResponse>>builder()
                .result(projectService.getProjectsByStatus(status))
                .build();
    }

    @GetMapping("/leader/{leaderId}")
    public ApiResponse<List<ProjectResponse>> getProjectsByLeader(@PathVariable String leaderId) {
        return ApiResponse.<List<ProjectResponse>>builder()
                .result(projectService.getProjectsByLeader(leaderId))
                .build();
    }

    @GetMapping("/date-range")
    public ApiResponse<List<ProjectResponse>> getProjectsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        return ApiResponse.<List<ProjectResponse>>builder()
                .result(projectService.getProjectsByDateRange(startDate, endDate))
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<List<ProjectResponse>> searchProjects(@RequestParam String keyword) {
        return ApiResponse.<List<ProjectResponse>>builder()
                .result(projectService.searchProjects(keyword))
                .build();
    }

    @GetMapping("/analytics")
    public ApiResponse<ProjectAnalyticsResponse> getProjectAnalytics() {
        return ApiResponse.<ProjectAnalyticsResponse>builder()
                .result(projectService.getProjectAnalytics())
                .build();
    }

    @GetMapping("/summaries")
    public ApiResponse<List<ProjectSummaryResponse>> getProjectSummaries() {
        return ApiResponse.<List<ProjectSummaryResponse>>builder()
                .result(projectService.getProjectSummaries())
                .build();
    }

    // Endpoints for task-service integration
    @PutMapping("/{projectId}/tasks/increment")
    public ApiResponse<Void> incrementTotalTasks(@PathVariable String projectId) {
        projectService.incrementTotalTasks(projectId);
        return ApiResponse.<Void>builder()
                .message("Total tasks incremented successfully")
                .build();
    }

    @PutMapping("/{projectId}/skills")
    public ApiResponse<Void> updateProjectSkills(@PathVariable String projectId, @RequestBody UpdateProjectSkillsRequest request) {
        projectService.updateProjectSkills(projectId, request.getSkillsToAdd());
        return ApiResponse.<Void>builder()
                .message("Project skills updated successfully")
                .build();
    }
}
