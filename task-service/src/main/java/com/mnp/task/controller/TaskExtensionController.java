package com.mnp.task.controller;


import com.mnp.task.dto.request.ApiResponse;
import com.mnp.task.dto.request.ExtensionReviewRequest;
import com.mnp.task.dto.request.TaskExtensionRequest;
import com.mnp.task.dto.response.TaskExtensionResponse;
import com.mnp.task.service.TaskExtensionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/extensions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskExtensionController {
    TaskExtensionService taskExtensionService;

    @PostMapping("/{taskId}")
    public ApiResponse<TaskExtensionResponse> requestExtension(
            @PathVariable String taskId,
            @RequestBody @Valid TaskExtensionRequest request) {
        log.info("Extension request received for task {}", taskId);

        TaskExtensionResponse response = taskExtensionService.requestExtension(taskId, request);

        return ApiResponse.<TaskExtensionResponse>builder()
                .result(response)
                .build();
    }

    @PutMapping("/{extensionRequestId}/review")
    public ApiResponse<TaskExtensionResponse> reviewExtensionRequest(
            @PathVariable String extensionRequestId,
            @RequestBody @Valid ExtensionReviewRequest request) {

        log.info("Extension review received for request {} ", extensionRequestId);

        TaskExtensionResponse response = taskExtensionService.reviewExtensionRequest(
                extensionRequestId, request);

        return ApiResponse.<TaskExtensionResponse>builder()
                .result(response)
                .build();
    }


    @GetMapping("/{taskId}/history")
    public ApiResponse<List<TaskExtensionResponse>> getTaskExtensionHistory(@PathVariable String taskId) {
        log.info("Fetching extension history for task: {}", taskId);

        List<TaskExtensionResponse> extensions = taskExtensionService.getTaskExtensionRequests(taskId);

        return ApiResponse.<List<TaskExtensionResponse>>builder()
                .result(extensions)
                .build();
    }

    /**
     * Get all extension requests by current user
     */
    @GetMapping("/my-requests")
    public ApiResponse<List<TaskExtensionResponse>> getMyExtensionRequests() {
        String userId = getCurrentUserId();
        log.info("Fetching extension requests for user: {}", userId);

        List<TaskExtensionResponse> extensions = taskExtensionService.getMyExtensionRequests(userId);

        return ApiResponse.<List<TaskExtensionResponse>>builder()
                .result(extensions)
                .build();
    }

    /**
     * Get pending extension requests (for team leads)
     */
    @GetMapping("/pending")
    public ApiResponse<List<TaskExtensionResponse>> getPendingExtensionRequests() {
        String teamLeadId = getCurrentUserId();
        log.info("Fetching pending extension requests for team lead: {}", teamLeadId);

        List<TaskExtensionResponse> extensions = taskExtensionService.getPendingExtensionRequests(teamLeadId);

        return ApiResponse.<List<TaskExtensionResponse>>builder()
                .result(extensions)
                .build();
    }

    @GetMapping("/all")
    public ApiResponse<List<TaskExtensionResponse>> getAllExtensionRequests() {
        String teamLeadId = getCurrentUserId();
        log.info("Fetching pending extension requests for team lead: {}", teamLeadId);

        List<TaskExtensionResponse> extensions = taskExtensionService.getAllExtensionRequests(teamLeadId);

        return ApiResponse.<List<TaskExtensionResponse>>builder()
                .result(extensions)
                .build();
    }


    @GetMapping("/approved")
    public ApiResponse<List<TaskExtensionResponse>> getApprovedExtensionRequests() {
        String teamLeadId = getCurrentUserId();
        log.info("Fetching approved extension requests for team lead: {}", teamLeadId);

        List<TaskExtensionResponse> extensions = taskExtensionService.getApprovedExtensionRequests(teamLeadId);

        return ApiResponse.<List<TaskExtensionResponse>>builder()
                .result(extensions)
                .build();
    }

    /**
     * Get extension summary for a task
     */
    @GetMapping("/{taskId}/summary")
    public ApiResponse<TaskExtensionResponse> getExtensionSummary(@PathVariable String taskId) {
        log.info("Fetching extension summary for task: {}", taskId);

        TaskExtensionResponse summary = taskExtensionService.getExtensionSummary(taskId);

        return ApiResponse.<TaskExtensionResponse>builder()
                .result(summary)
                .build();
    }

    /**
     * Helper method to get current user ID from security context
     */
    private String getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        var authentication = context.getAuthentication();

        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            throw new RuntimeException("User not authenticated");
        }

        return authentication.getName();
    }
}
