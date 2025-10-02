package com.mnp.assignment.controller;

import com.mnp.assignment.dto.AssignmentRecommendationDto;
import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.request.CreateAssignmentRequest;
import com.mnp.assignment.dto.request.ReassignTaskRequest;
import com.mnp.assignment.dto.response.AssignmentResponse;
import com.mnp.assignment.dto.response.AssignmentHistoryResponse;
import com.mnp.assignment.service.AssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/assignments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Tag(name = "Assignment Management", description = "APIs for managing task assignments")
public class AssignmentController {

    AssignmentService assignmentService;

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get user's assignments", description = "Retrieve all assignments for a specific user")
    public ApiResponse<List<AssignmentResponse>> getUserAssignments(@PathVariable String userId) {
        log.info("Getting assignments for user: {}", userId);

        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByUserId(userId);

        return ApiResponse.<List<AssignmentResponse>>builder()
                .result(assignments)
                .build();
    }

    @GetMapping("/task/{taskId}")
    @Operation(summary = "Get task assignments", description = "Retrieve all assignments for a specific task")
    public ApiResponse<List<AssignmentResponse>> getTaskAssignments(@PathVariable String taskId) {
        log.info("Getting assignments for task: {}", taskId);

        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByTaskId(taskId);

        return ApiResponse.<List<AssignmentResponse>>builder()
                .result(assignments)
                .build();
    }

    @PostMapping
    @Operation(summary = "Create manual assignment", description = "Create a new manual assignment for a task")
    public ApiResponse<AssignmentResponse> createAssignment(@RequestBody @Valid CreateAssignmentRequest request) {
        log.info("Creating manual assignment for task: {} to user: {}", request.getTaskId(), request.getCandidateUserId());

        AssignmentResponse assignment = assignmentService.createAssignment(request);

        return ApiResponse.<AssignmentResponse>builder()
                .result(assignment)
                .build();
    }

    @DeleteMapping("/{assignmentId}")
    @Operation(summary = "Delete assignment", description = "Delete an assignment by ID")
    public ApiResponse<String> deleteAssignment(@PathVariable String assignmentId) {
        log.info("Deleting assignment: {}", assignmentId);

        assignmentService.deleteAssignment(assignmentId);

        return ApiResponse.<String>builder()
                .result("Assignment deleted successfully")
                .build();
    }

    @PostMapping("/{assignmentId}/select")
    @Operation(summary = "Select assignment", description = "Select/activate an assignment")
    public ApiResponse<AssignmentResponse> selectAssignment(@PathVariable String assignmentId) {
        log.info("Selecting assignment: {}", assignmentId);

        AssignmentResponse assignment = assignmentService.selectAssignment(assignmentId);

        return ApiResponse.<AssignmentResponse>builder()
                .result(assignment)
                .build();
    }

    @GetMapping("/history/{taskId}")
    @Operation(summary = "Get task assignment history", description = "Retrieve assignment history for a specific task")
    public ApiResponse<List<AssignmentHistoryResponse>> getAssignmentHistory(@PathVariable String taskId) {
        log.info("Getting assignment history for task: {}", taskId);

        List<AssignmentHistoryResponse> assignmentHistory = assignmentService.getAssignmentHistoryByTaskId(taskId);

        return ApiResponse.<List<AssignmentHistoryResponse>>builder()
                .result(assignmentHistory)
                .build();
    }

    @PostMapping("/{assignmentId}/reassign")
    @Operation(summary = "Reassign task", description = "Reassign a task to a different user with a reason")
    public ApiResponse<AssignmentResponse> reassignTask(
            @PathVariable String assignmentId,
            @RequestBody @Valid ReassignTaskRequest request) {
        log.info("Reassigning assignment {} to user: {} with reason: {}",
                assignmentId, request.getNewAssigneeId(), request.getReason());

        AssignmentResponse assignment = assignmentService.reassignTask(assignmentId, request);

        return ApiResponse.<AssignmentResponse>builder()
                .result(assignment)
                .build();
    }

    @GetMapping("/ai-recommend/{taskId}")
    @Operation(summary = "Get AI-powered assignment recommendations",
               description = "Get intelligent task assignment recommendations using ML algorithms")
    public ApiResponse<List<AssignmentRecommendationDto>> getAIRecommendations(@PathVariable String taskId) {
        log.info("Getting AI recommendations for task: {}", taskId);

        List<AssignmentRecommendationDto> recommendations = assignmentService.getAIRecommendations(taskId);

        return ApiResponse.<List<AssignmentRecommendationDto>>builder()
                .result(recommendations)
                .build();
    }
}