package com.mnp.task.controller;

import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.dto.request.TaskSubmissionUpdateRequest;
import com.mnp.task.dto.request.ReviewUpdateRequest;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.enums.SubmissionStatus;
import com.mnp.task.service.AuthenticationService;
import com.mnp.task.service.TaskSubmissionService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/tasks/{taskId}/submissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskSubmissionController {

    TaskSubmissionService taskSubmissionService;
    AuthenticationService authenticationService;

    /**
     * Submit a task with optional file attachment
     */
    @PostMapping
    public ResponseEntity<TaskSubmissionResponse> submitTask(
            @PathVariable String taskId,
            @RequestBody @Valid TaskSubmissionRequest request,  // ✅ ĐÚNG - @RequestBody cho JSON
            HttpServletRequest httpRequest) {
        log.info("Submitting task {} for user {}", taskId, httpRequest.getRemoteUser());
        String userId = authenticationService.getUserIdFromRequest(httpRequest);
        TaskSubmissionResponse response = taskSubmissionService.submitTask(taskId, userId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get all submissions for a specific task (for team leads to review)
     */
    @GetMapping
    public ResponseEntity<List<TaskSubmissionResponse>> getTaskSubmissions(@PathVariable String taskId) {
        List<TaskSubmissionResponse> submissions = taskSubmissionService.getTaskSubmissions(taskId);
        return ResponseEntity.ok(submissions);
    }

    /**
     * Get specific submission details
     */
    @GetMapping("/{submissionId}")
    public ResponseEntity<TaskSubmissionResponse> getSubmissionDetails(@PathVariable String submissionId) {
        TaskSubmissionResponse submission = taskSubmissionService.getSubmissionById(submissionId);
        return ResponseEntity.ok(submission);
    }

    /**
     * Download attachment from a submission
     */
//    @GetMapping("/{submissionId}/attachment")
//    public ResponseEntity<Resource> downloadAttachment(@PathVariable String submissionId) {
//        return taskSubmissionService.downloadAttachment(submissionId);
//    }

    /**
     * Enhanced review a submission with quality rating and performance updates - for team leads
     */
    @PostMapping("/{submissionId}/review-detailed")
    public ResponseEntity<TaskSubmissionResponse> reviewSubmissionDetailed(
            @PathVariable String submissionId,
            @RequestBody @Valid ReviewUpdateRequest reviewRequest,
            HttpServletRequest httpRequest) {

        String reviewerId = authenticationService.getUserIdFromRequest(httpRequest);
        log.info("Team lead {} reviewing submission {} with quality rating {}", 
                reviewerId, submissionId, reviewRequest.getQualityRating());

        TaskSubmissionResponse response = taskSubmissionService.reviewSubmissionWithQuality(
                submissionId, reviewerId, reviewRequest);
        return ResponseEntity.ok(response);
    }

    /**
     * Review a submission (approve/reject) - for team leads (legacy endpoint)
     */
    @PutMapping("/{submissionId}/review")
    public ResponseEntity<TaskSubmissionResponse> reviewSubmission(
            @PathVariable String submissionId,
            @RequestParam SubmissionStatus status,
            @RequestParam(required = false) String comments,
            HttpServletRequest httpRequest) {

        String reviewerId = authenticationService.getUserIdFromRequest(httpRequest);

        TaskSubmissionResponse response = taskSubmissionService.reviewSubmission(submissionId, reviewerId, status, comments);
        return ResponseEntity.ok(response);
    }

    /**
     * Edit a review (for team leads to modify their previous review)
     */
    @PatchMapping("/{submissionId}/review")
    public ResponseEntity<TaskSubmissionResponse> editReview(
            @PathVariable String taskId,
            @PathVariable String submissionId,
            @RequestParam SubmissionStatus status,
            @RequestParam(required = false) String comments,
            HttpServletRequest httpRequest) {

        String reviewerId = authenticationService.getUserIdFromRequest(httpRequest);
        log.info("Team lead {} editing review for submission {}", reviewerId, submissionId);

        TaskSubmissionResponse response = taskSubmissionService.editReview(submissionId, reviewerId, status, comments);
        return ResponseEntity.ok(response);
    }

    /**
     * Edit a submission (for employees to modify their submission after submitting)
     */
    @PatchMapping("/{submissionId}")
    public ResponseEntity<TaskSubmissionResponse> editSubmission(
            @PathVariable String taskId,
            @PathVariable String submissionId,
            @RequestBody @Valid TaskSubmissionUpdateRequest request,
            HttpServletRequest httpRequest) {

        String userId = authenticationService.getUserIdFromRequest(httpRequest);
        log.info("User {} editing submission {} for task {}", userId, submissionId, taskId);

        TaskSubmissionResponse response = taskSubmissionService.editSubmission(submissionId, userId, request);
        return ResponseEntity.ok(response);
    }
}

/**
 * Separate controller for user's own submissions
 */
@RestController
@RequestMapping("/my-submissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
class UserSubmissionController {

    TaskSubmissionService taskSubmissionService;
    AuthenticationService authenticationService;

    /**
     * Get current user's submissions
     */
    @GetMapping
    public ResponseEntity<List<TaskSubmissionResponse>> getMySubmissions(HttpServletRequest request) {
        String userId = authenticationService.getUserIdFromRequest(request);
        List<TaskSubmissionResponse> submissions = taskSubmissionService.getUserSubmissions(userId);
        return ResponseEntity.ok(submissions);
    }
}
