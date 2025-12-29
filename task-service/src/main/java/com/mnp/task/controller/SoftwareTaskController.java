package com.mnp.task.controller;

import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.dto.request.ReviewUpdateRequest;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.entity.TaskCommit;
import com.mnp.task.service.GitIntegrationService;
import com.mnp.task.service.SoftwareWorkflowService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/software-workflow")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SoftwareTaskController {

    SoftwareWorkflowService softwareWorkflowService;
    GitIntegrationService gitIntegrationService;

    // --- GIT WEBHOOK ---
    @PostMapping("/webhook/github")
    public ApiResponse<String> handleGitHubWebhook(@RequestBody Map<String, Object> payload) {
        gitIntegrationService.processGitHubPush(payload);
        return ApiResponse.<String>builder().result("Received").build();
    }

    // --- GET COMMITS ---
    @GetMapping("/tasks/{taskId}/commits")
    public ApiResponse<List<TaskCommit>> getTaskCommits(@PathVariable String taskId) {
        return ApiResponse.<List<TaskCommit>>builder()
                .result(gitIntegrationService.getTaskCommits(taskId))
                .build();
    }

    // --- SUBMIT (Software Process) ---
    @PostMapping("/tasks/{taskId}/submit")
    public ApiResponse<TaskSubmissionResponse> submitTask(
            @PathVariable String taskId,
            @RequestHeader("X-User-Id") String userId, // Giả sử lấy từ Gateway/Token
            @RequestBody TaskSubmissionRequest request) {

        var result = softwareWorkflowService.submitSoftwareTask(taskId, userId, request);
        return ApiResponse.<TaskSubmissionResponse>builder().result(result).build();
    }

    // --- REVIEW (Software Process - Auto create Bug) ---
    @PostMapping("/submissions/{submissionId}/review")
    public ApiResponse<TaskSubmissionResponse> reviewTask(
            @PathVariable String submissionId,
            @RequestHeader("X-User-Id") String reviewerId,
            @RequestBody ReviewUpdateRequest request) {

        var result = softwareWorkflowService.reviewSoftwareTask(submissionId, reviewerId, request);
        return ApiResponse.<TaskSubmissionResponse>builder().result(result).build();
    }
}