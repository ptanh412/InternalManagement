package com.mnp.task.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.task.client.FileServiceClient;
import com.mnp.task.client.IdentityClient;
import com.mnp.task.client.ProjectServiceClient;
import com.mnp.task.client.RealTimeNotificationClient;
import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.dto.request.TaskSubmissionUpdateRequest;
import com.mnp.task.dto.request.ReviewUpdateRequest;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskSubmission;
import com.mnp.task.enums.SubmissionStatus;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.exception.AppException;
import com.mnp.task.exception.ErrorCode;
import com.mnp.task.mapper.TaskSubmissionMapper;
import com.mnp.task.repository.TaskRepository;
import com.mnp.task.repository.TaskSubmissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskSubmissionService {

    TaskSubmissionRepository taskSubmissionRepository;
    TaskSubmissionMapper taskSubmissionMapper;
    ObjectMapper objectMapper;
    // Add new dependencies
    TaskRepository taskRepository;
    ProjectServiceClient projectServiceClient;
    IdentityClient identityClient;
    TaskSocketIOService taskSocketIOService;
    TaskService taskService;
    private final RealTimeNotificationClient realTimeNotificationClient;
    WorkloadIntegrationService workloadIntegrationService;

    /**
     * Submit a task with optional file attachment
     */

    private void sendRealTimeTaskSubmissionNotification( String employeeId,String taskId, String taskTitle,
                                                         String projectName,
                                                         String assignedBy,
                                                         String dueDate) {
        try {
            RealTimeNotificationClient.TaskAssignmentNotificationRequest request =
                    new RealTimeNotificationClient.TaskAssignmentNotificationRequest(
                            employeeId,
                            taskId,
                            taskTitle,
                            projectName,
                            assignedBy,
                            dueDate
                    );
            realTimeNotificationClient.sendSubmitTaskNotificationToTeamLead(request);
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for task: {}", taskId, e);
        }
    }
    public TaskSubmissionResponse submitTask(String taskId, String userId, TaskSubmissionRequest request) {
        // Check if user already submitted this task
        var existingSubmission = taskSubmissionRepository.findByTaskIdAndSubmittedBy(taskId, userId);
        if (existingSubmission.isPresent()) {
            log.warn("User {} already submitted task {}", userId, taskId);
            throw new AppException(ErrorCode.TASK_ALREADY_SUBMITTED);
        }

        // Convert attachments to JSON string
        String attachmentsJson = null;
        try {
            if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
                attachmentsJson = objectMapper.writeValueAsString(request.getAttachments());
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize attachments", e);
            throw new AppException(ErrorCode.INVALID_ATTACHMENT);
        }

        // Create task submission
        TaskSubmission submission = TaskSubmission.builder()
                .taskId(taskId)
                .submittedBy(userId)
                .description(request.getDescription())
                .attachmentsJson(attachmentsJson)
                .status(SubmissionStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        submission = taskSubmissionRepository.save(submission);

        // Save employee's final progress assessment if provided
        if (request.getProgressPercentage() != null) {
            try {
                Task task = taskRepository.findById(taskId)
                        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                task.setProgressPercentage(request.getProgressPercentage());
                taskRepository.save(task);
                log.info("Updated task progress to {}% during submission: taskId={}", 
                        request.getProgressPercentage(), taskId);
            } catch (Exception e) {
                log.error("Failed to update progress percentage during submission: taskId={}", taskId, e);
                // Don't fail submission if progress update fails
            }
        }

        // Update task status to REVIEW when submission is created
        updateTaskStatus(taskId, TaskStatus.REVIEW);

        log.info("Task submission created: taskId={}, userId={}, submissionId={}",
                taskId, userId, submission.getId());

        String projectName = projectServiceClient.getProjectName(taskService.getTask(taskId).getProjectId()).getResult().getName();
        TaskResponse taskResult = taskService.getTask(submission.getTaskId());
        String assignByName = getUserFullName(taskResult.getCreatedBy());
        try {
            sendRealTimeTaskSubmissionNotification(
                    submission.getSubmittedBy(),
                    submission.getTaskId(),
                    taskService.getTaskName(submission.getTaskId()),
                    projectName,
                    assignByName,
                    submission.getSubmittedAt().toLocalDate().toString()
            );
            log.info("Real-time task review notification sent for submission: {}", submission.getId());
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for submission: {}", submission.getId(), e);
        }

        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Get all submissions for a specific task (for team leads)
     */
    public List<TaskSubmissionResponse> getTaskSubmissions(String taskId) {
        List<TaskSubmission> submissions = taskSubmissionRepository.findByTaskIdOrderBySubmittedAtDesc(taskId);
        return submissions.stream()
                .map(this::createTaskSubmissionResponseWithProjectInfo)
                .toList();
    }

    /**
     * Get submissions by a specific user
     */
    public List<TaskSubmissionResponse> getUserSubmissions(String userId) {
        List<TaskSubmission> submissions = taskSubmissionRepository.findBySubmittedByOrderBySubmittedAtDesc(userId);
        return submissions.stream()
                .map(this::createTaskSubmissionResponseWithProjectInfo)
                .toList();
    }

    /**
     * Get specific submission details
     */
    public TaskSubmissionResponse getSubmissionById(String submissionId) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Download attachment file
     */
//    public ResponseEntity<Resource> downloadAttachment(String submissionId) {
//        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
//                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
//
//        if (submission.getAttachmentUrl() == null) {
//            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
//        }
//
//        // Extract filename from URL for download
//        String fileName = extractFileNameFromUrl(submission.getAttachmentUrl());
//
//        try {
//            return fileServiceClient.downloadFile(fileName);
//        } catch (Exception e) {
//            log.error("Failed to download attachment for submission {}: {}", submissionId, e.getMessage());
//            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
//        }
//    }

    /**
     * Review a task submission (for team leads)
     */
    private String getUserFullName(String userId) {
        try {
            var response = identityClient.getFullName(userId);
            if (response != null && response.getResult() != null) {
                return response.getResult().getFirstName() + " " + response.getResult().getLastName();
            }
            return "Unknown User";
        } catch (Exception e) {
            log.warn("Failed to get user name for ID {}: {}", userId, e.getMessage());
            return "Unknown User";
        }
    }

    public TaskSubmissionResponse reviewSubmission(String submissionId, String reviewerId, SubmissionStatus status, String comments) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        SubmissionStatus oldStatus = submission.getStatus();

        submission.setStatus(status);
        submission.setReviewComments(comments);
        submission.setReviewedBy(reviewerId);
        submission.setReviewedAt(LocalDateTime.now());

        submission = taskSubmissionRepository.save(submission);

        String reviewName = getUserFullName(reviewerId);
        String taskName = taskService.getTaskName(submission.getTaskId());

        // Get old task status before updating
        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        TaskStatus oldTaskStatus = task.getStatus();

        // Update task status based on submission review result
        TaskStatus newTaskStatus = determineTaskStatusFromSubmissionStatus(status);
        updateTaskStatus(submission.getTaskId(), newTaskStatus);

        // **UPDATE COMPLETED TASKS IN PROJECT**
        String projectId = task.getProjectId();
        updateProjectCompletedTasks(projectId, oldTaskStatus, newTaskStatus);

        // Socket notification
        taskSocketIOService.notifyStatusTaskAfterReviewToSubmitBy(
                status.name().toLowerCase(),
                createTaskSubmissionResponseWithProjectInfo(submission),
                taskName
        );

        String projectName = projectServiceClient.getProjectName(projectId).getResult().getName();

        // Real-time notification
        try {
            sendRealTimeTaskReviewNotification(
                    submission.getSubmittedBy(),
                    submission.getTaskId(),
                    taskName,
                    projectName,
                    reviewName,
                    status.name(),
                    comments,
                    newTaskStatus.name()
            );
            log.info("Real-time task review notification sent for submission: {}", submissionId);
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for submission: {}", submissionId, e);
        }

        log.info("Task submission reviewed: submissionId={}, status={}, taskId={}, newTaskStatus={}",
                submissionId, status, submission.getTaskId(), newTaskStatus);

        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Enhanced review submission method with quality rating and performance score updates
     */
    public TaskSubmissionResponse reviewSubmissionWithQuality(String submissionId, String reviewerId, 
                                                            ReviewUpdateRequest reviewRequest) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        SubmissionStatus oldStatus = submission.getStatus();

        // Update submission with review details
        submission.setStatus(reviewRequest.getStatus());
        submission.setReviewComments(reviewRequest.getComments());
        submission.setReviewedBy(reviewerId);
        submission.setReviewedAt(LocalDateTime.now());

        submission = taskSubmissionRepository.save(submission);

        String reviewName = getUserFullName(reviewerId);
        String taskName = taskService.getTaskName(submission.getTaskId());

        // Get task details for performance calculation
        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        TaskStatus oldTaskStatus = task.getStatus();

        // Update task with quality rating if provided
        if (reviewRequest.getQualityRating() != null) {
            task.setQualityRating(reviewRequest.getQualityRating());
            task.setQualityComments(reviewRequest.getComments());
            taskRepository.save(task);
        }

        // Update task status based on submission review result
        TaskStatus newTaskStatus = determineTaskStatusFromSubmissionStatus(reviewRequest.getStatus());
        updateTaskStatus(submission.getTaskId(), newTaskStatus);

        // Update performance score if task is approved and completed
        if (reviewRequest.getStatus() == SubmissionStatus.APPROVED && 
            newTaskStatus == TaskStatus.DONE && 
            reviewRequest.getQualityRating() != null) {
            
            updatePerformanceScoreAfterReview(task, reviewRequest);
        }

        // **UPDATE COMPLETED TASKS IN PROJECT**
        String projectId = task.getProjectId();
        updateProjectCompletedTasks(projectId, oldTaskStatus, newTaskStatus);

        // Socket notification
        taskSocketIOService.notifyStatusTaskAfterReviewToSubmitBy(
                reviewRequest.getStatus().name().toLowerCase(),
                createTaskSubmissionResponseWithProjectInfo(submission),
                taskName
        );

        String projectName = projectServiceClient.getProjectName(projectId).getResult().getName();

        // Real-time notification
        try {
            sendRealTimeTaskReviewNotification(
                    submission.getSubmittedBy(),
                    submission.getTaskId(),
                    taskName,
                    projectName,
                    reviewName,
                    reviewRequest.getStatus().name(),
                    reviewRequest.getComments(),
                    newTaskStatus.name()
            );
            log.info("Real-time task review notification sent for submission: {}", submissionId);
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for submission: {}", submissionId, e);
        }

        log.info("Task submission reviewed with quality rating: submissionId={}, status={}, taskId={}, qualityRating={}, newTaskStatus={}",
                submissionId, reviewRequest.getStatus(), submission.getTaskId(), reviewRequest.getQualityRating(), newTaskStatus);

        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Update performance score after task review
     */
    private void updatePerformanceScoreAfterReview(Task task, ReviewUpdateRequest reviewRequest) {
        try {
            // Calculate if task was completed on time
            boolean completedOnTime = task.getDueDate() == null || 
                    (task.getCompletedAt() != null && !task.getCompletedAt().isAfter(task.getDueDate()));

            // Create performance update request
            IdentityClient.PerformanceUpdateRequest performanceRequest = 
                    new IdentityClient.PerformanceUpdateRequest(
                        task.getAssignedTo(),
                        task.getId(),
                        reviewRequest.getQualityRating(),
                        completedOnTime,
                        reviewRequest.getTaskComplexity() != null ? reviewRequest.getTaskComplexity() : "MEDIUM",
                        task.getEstimatedHours(),
                        task.getActualHours(),
                        reviewRequest.getComments()
                    );

            // Call identity service to update performance score
            identityClient.updatePerformanceScore(performanceRequest);
            
            log.info("Performance score update requested for user: {} after task: {}", 
                    task.getAssignedTo(), task.getId());
                    
        } catch (Exception e) {
            log.error("Failed to update performance score for user: {} after task: {} - Error: {}", 
                    task.getAssignedTo(), task.getId(), e.getMessage());
            // Don't fail the entire review process if performance update fails
        }
    }

    private void sendRealTimeTaskReviewNotification(String employeeId, String taskId, String taskTitle,
                                                    String projectName, String reviewedBy,
                                                    String reviewStatus, String comments, String newTaskStatus) {
        try {
            RealTimeNotificationClient.TaskReviewNotificationRequest request =
                    new RealTimeNotificationClient.TaskReviewNotificationRequest(
                            employeeId,
                            taskId,
                            taskTitle,
                            projectName,
                            reviewedBy,
                            reviewStatus,
                            comments,
                            newTaskStatus
                    );

            realTimeNotificationClient.sendTaskReviewNotification(request);
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for task: {}", taskId, e);
        }
    }

    /**
     * Edit a task submission (for employees after they've submitted)
     */
    public TaskSubmissionResponse editSubmission(String submissionId, String userId, TaskSubmissionUpdateRequest request) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify that the user is the one who submitted this task
        if (!submission.getSubmittedBy().equals(userId)) {
            log.warn("User {} attempted to edit submission {} which was submitted by {}",
                    userId, submissionId, submission.getSubmittedBy());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Only allow editing if submission is in PENDING or NEEDS_REVISION status
        if (submission.getStatus() != SubmissionStatus.PENDING &&
            submission.getStatus() != SubmissionStatus.NEEDS_REVISION) {
            log.warn("Cannot edit submission {} with status {}", submissionId, submission.getStatus());
            throw new AppException(ErrorCode.CANNOT_EDIT_SUBMISSION);
        }

        // Update submission details
        if (request.getDescription() != null) {
            submission.setDescription(request.getDescription());
        }

        // Update attachments if provided
        if (request.getAttachments() != null) {
            String attachmentsJson = null;
            try {
                if (!request.getAttachments().isEmpty()) {
                    attachmentsJson = objectMapper.writeValueAsString(request.getAttachments());
                }
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize attachments during edit", e);
                throw new AppException(ErrorCode.INVALID_ATTACHMENT);
            }
            submission.setAttachmentsJson(attachmentsJson);
        }

        // Update task progress percentage if provided
        if (request.getProgressPercentage() != null) {
            try {
                Task task = taskRepository.findById(submission.getTaskId())
                        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
                task.setProgressPercentage(request.getProgressPercentage());
                taskRepository.save(task);
                log.info("Updated task progress to {}% during submission edit: taskId={}", 
                        request.getProgressPercentage(), task.getId());
            } catch (Exception e) {
                log.error("Failed to update progress percentage during submission edit: submissionId={}", 
                        submissionId, e);
                // Don't fail submission edit if progress update fails
            }
        }

        // Update the submission timestamp to reflect the edit
        submission.setSubmittedAt(LocalDateTime.now());

        // Reset review status since submission was modified
        if (submission.getStatus() == SubmissionStatus.NEEDS_REVISION) {
            submission.setStatus(SubmissionStatus.PENDING);
            submission.setReviewComments(null);
            submission.setReviewedBy(null);
            submission.setReviewedAt(null);
        }

        submission = taskSubmissionRepository.save(submission);

        log.info("Task submission edited: submissionId={}, userId={}, taskId={}",
                submissionId, userId, submission.getTaskId());

        // Send notification about submission update
        sendSubmissionUpdateNotification(submission, "edited");



        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Edit a review (for team leads after they've reviewed)
     */
    public TaskSubmissionResponse editReview(String submissionId, String reviewerId, SubmissionStatus status, String comments) {
        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify that the user is the one who reviewed this submission
        if (!reviewerId.equals(submission.getReviewedBy())) {
            log.warn("User {} attempted to edit review for submission {} which was reviewed by {}",
                    reviewerId, submissionId, submission.getReviewedBy());
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Only allow editing if submission has been reviewed (not PENDING)
        if (submission.getStatus() == SubmissionStatus.PENDING) {
            log.warn("Cannot edit review for submission {} with status {}", submissionId, submission.getStatus());
            throw new AppException(ErrorCode.CANNOT_EDIT_REVIEW);
        }

        SubmissionStatus oldSubmissionStatus = submission.getStatus();

        // Update review details
        submission.setStatus(status);
        submission.setReviewComments(comments);
        submission.setReviewedAt(LocalDateTime.now());

        submission = taskSubmissionRepository.save(submission);

        // Get task and old status
        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
        TaskStatus oldTaskStatus = task.getStatus();

        // Update task status based on new review status
        TaskStatus newTaskStatus = determineTaskStatusFromSubmissionStatus(status);
        updateTaskStatus(submission.getTaskId(), newTaskStatus);

        // **UPDATE COMPLETED TASKS IN PROJECT**
        String projectId = task.getProjectId();
        updateProjectCompletedTasks(projectId, oldTaskStatus, newTaskStatus);

        // Send notification about review update
        String taskName = taskService.getTaskName(submission.getTaskId());
        taskSocketIOService.notifyStatusTaskAfterReviewToSubmitBy(
                status.name().toLowerCase(),
                createTaskSubmissionResponseWithProjectInfo(submission),
                taskName
        );

        String reviewName = getUserFullName(reviewerId);
        String projectName = projectServiceClient.getProjectName(projectId).getResult().getName();

        try {
            sendRealTimeTaskReviewNotification(
                    submission.getSubmittedBy(),
                    submission.getTaskId(),
                    taskName,
                    projectName,
                    reviewName,
                    status.name(),
                    comments,
                    newTaskStatus.name()
            );
            log.info("Real-time task review notification sent for submission: {}", submissionId);
        } catch (Exception e) {
            log.error("Failed to send real-time task review notification for submission: {}", submissionId, e);
        }

        return createTaskSubmissionResponseWithProjectInfo(submission);
    }

    /**
     * Update project's completedTasks count based on task status change
     */
    private void updateProjectCompletedTasks(String projectId, TaskStatus oldStatus, TaskStatus newStatus) {
        try {
            // Task changed from non-DONE to DONE
            if (oldStatus != TaskStatus.DONE && newStatus == TaskStatus.DONE) {
                projectServiceClient.incrementCompletedTasks(projectId);
                log.info("Incremented completedTasks for project: {}", projectId);
            }
            // Task changed from DONE to non-DONE
            else if (oldStatus == TaskStatus.DONE && newStatus != TaskStatus.DONE) {
                projectServiceClient.decrementCompletedTasks(projectId);
                log.info("Decremented completedTasks for project: {}", projectId);
            }
        } catch (Exception e) {
            log.error("Failed to update completedTasks for project: {}", projectId, e);
        }
    }

    /**
     * Send notification when submission is updated
     */
    private void sendSubmissionUpdateNotification(TaskSubmission submission, String action) {
        try {
            String taskName = taskService.getTaskName(submission.getTaskId());
            TaskSubmissionResponse submissionResponse = createTaskSubmissionResponseWithProjectInfo(submission);

            // Notify team lead about submission update
            String teamLeadId = getTeamLeadForTask(submission.getTaskId());
            if (teamLeadId != null) {
                taskSocketIOService.notifySubmissionUpdated(submissionResponse, taskName, action);
            }

            log.info("Sent submission {} notification for submissionId={}", action, submission.getId());
        } catch (Exception e) {
            log.error("Failed to send submission {} notification: {}", action, e.getMessage());
        }
    }

    /**
     * Get team lead ID for a task
     */
    private String getTeamLeadForTask(String taskId) {
        try {
            Task task = taskRepository.findById(taskId).orElse(null);
            if (task != null && task.getProjectId() != null) {
                var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
                if (projectResponse != null && projectResponse.getResult() != null) {
                    return projectResponse.getResult().getTeamLeadId();
                }
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to get team lead for task {}: {}", taskId, e.getMessage());
            return null;
        }
    }

    /**
     * Determine what task status should be set based on submission status
     */
    private TaskStatus determineTaskStatusFromSubmissionStatus(SubmissionStatus submissionStatus) {
        return switch (submissionStatus) {
            case APPROVED -> TaskStatus.DONE;  // Task completed successfully
            case REJECTED -> TaskStatus.IN_PROGRESS;  // Task needs to be reworked
            case NEEDS_REVISION -> TaskStatus.IN_PROGRESS;  // Task needs to be reworked
            case PENDING -> TaskStatus.REVIEW;  // Task is under review
        };
    }

    /**
     * Helper method to update task status
     */
    private void updateTaskStatus(String taskId, TaskStatus status) {
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

            TaskStatus oldStatus = task.getStatus();
            task.setStatus(status);

            // Update completion timestamp if task is marked as DONE
            // Note: progressPercentage is preserved as employee's self-evaluation
            // and not automatically set to 100% to maintain accuracy of self-assessment
            if (status == TaskStatus.DONE && oldStatus != TaskStatus.DONE) {
                task.setCompletedAt(LocalDateTime.now());
                // Removed automatic progressPercentage = 100% to preserve employee self-evaluation
            }

            taskRepository.save(task);
            log.info("Task status updated: taskId={}, oldStatus={}, newStatus={}", taskId, oldStatus, status);

            // **UPDATE WORKLOAD SERVICE FOR STATUS CHANGE**
            try {
                workloadIntegrationService.updateTaskStatusInWorkload(task, oldStatus, status);

                // Remove task from workload if completed or cancelled
                if (status == TaskStatus.DONE || status == TaskStatus.CANCELLED) {
                    workloadIntegrationService.removeTaskFromWorkload(task);
                    log.info("Removed completed/cancelled task {} from workload service", taskId);
                }
            } catch (Exception e) {
                log.error("Failed to update workload service for status change: {}", e.getMessage());
            }
        } catch (Exception e) {
            log.error("Failed to update task status: taskId={}, status={}, error={}", taskId, status, e.getMessage());
            // Don't throw exception to avoid breaking the submission review process
        }
    }

    private String extractFileNameFromUrl(String url) {
        // Extract filename from the file service URL
        // Assuming URL format is like: http://localhost:8083/file/media/download/filename
        return url.substring(url.lastIndexOf('/') + 1);
    }

    /**
     * Helper method to get project information and create TaskSubmissionResponse with project details
     */
    private TaskSubmissionResponse createTaskSubmissionResponseWithProjectInfo(TaskSubmission submission) {

        log.info("Submission request: submissionId={}, reviewerId={}", submission.getSubmittedBy(), submission.getReviewedBy());
        String projectName = "Unknown Project";
        String teamLeadName = "Unknown Team Lead";

        // Get submitter name
        var submitByNameResponse = identityClient.getFullName(submission.getSubmittedBy());
        String submitByName = submitByNameResponse.getResult().getFirstName() + " " + submitByNameResponse.getResult().getLastName();

        // Get reviewer name - check if reviewedBy exists
        String reviewByName;
        if (submission.getReviewedBy() != null && !submission.getReviewedBy().isEmpty()) {
            var reviewByNameResponse = identityClient.getFullName(submission.getReviewedBy());
            reviewByName = reviewByNameResponse.getResult().getFirstName() + " " + reviewByNameResponse.getResult().getLastName();
        } else {
            reviewByName = "Have not comment yet";
        }

        try {
            // Get task to find project ID
            Task task = taskRepository.findById(submission.getTaskId()).orElse(null);
            if (task != null && task.getProjectId() != null) {
                // Get project information
                var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
                if (projectResponse != null && projectResponse.getResult() != null) {
                    var project = projectResponse.getResult();
                    projectName = project.getName() != null ? project.getName() : "Unknown Project";

                    // Get team lead name
                    String teamLeadId = project.getTeamLeadId();
                    if (teamLeadId != null && !teamLeadId.isEmpty()) {
                        var userResponse = identityClient.getFullName(teamLeadId);
                        var result = userResponse.getResult();
                        teamLeadName = result.getFirstName() + " " + result.getLastName();
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch project information for task {}: {}", submission.getTaskId(), e.getMessage());
        }

        return taskSubmissionMapper.toTaskSubmissionResponse(submission, projectName, teamLeadName, submitByName, reviewByName);
    }
}
