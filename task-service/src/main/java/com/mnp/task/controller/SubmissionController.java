package com.mnp.task.controller;

import com.mnp.task.dto.request.SubmissionReviewRequest;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/submissions")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SubmissionController {

    TaskService taskService;

    @PutMapping("/{submissionId}/review")
    public ResponseEntity<TaskSubmissionResponse> reviewSubmission(
            @PathVariable String submissionId,
            @Valid @RequestBody SubmissionReviewRequest request) {
        return ResponseEntity.ok(taskService.reviewSubmission(submissionId, request));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<TaskSubmissionResponse>> getPendingSubmissions() {
        return ResponseEntity.ok(taskService.getPendingSubmissions());
    }

    @GetMapping("/my-reviews")
    public ResponseEntity<List<TaskSubmissionResponse>> getMyReviews() {
        return ResponseEntity.ok(taskService.getMyReviews());
    }
}