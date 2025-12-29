package com.mnp.task.service;

import com.mnp.task.client.IdentityClient;
import com.mnp.task.client.ProjectServiceClient;
import com.mnp.task.client.RealTimeNotificationClient;
import com.mnp.task.dto.request.ExtensionReviewRequest;
import com.mnp.task.dto.request.TaskExtensionRequest;
import com.mnp.task.dto.response.TaskExtensionResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskExtension;
import com.mnp.task.enums.ExtensionStatus;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.exception.AppException;
import com.mnp.task.exception.ErrorCode;
import com.mnp.task.mapper.TaskExtensionMapper;
import com.mnp.task.repository.TaskExtensionRepository;
import com.mnp.task.repository.TaskRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskExtensionService {
    TaskRepository taskRepository;
    TaskExtensionRepository extensionRequestRepository;
    ProjectServiceClient projectServiceClient;
    WorkloadIntegrationService workloadIntegrationService;
    TaskExtensionMapper extensionMapper;
    IdentityClient identityClient;
    TaskSocketIOService taskSocketIOService;
    RealTimeNotificationClient realTimeNotificationClient;

    private static final int MAX_EXTENSIONS_PER_TASK = 2;

    /**
     * Request task extension (by employee)
     */

    private String getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        var authentication = context.getAuthentication();

        // Handle cases where there's no authentication context (internal calls)
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            return "SYSTEM"; // Return a default value for internal calls
        }

        return authentication.getName();
    }

    @Transactional
    public TaskExtensionResponse requestExtension(
            String taskId,
            TaskExtensionRequest request) {

        String userId = getCurrentUserId();

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Verify task is assigned to this user
        if (!task.getAssignedTo().equals(userId)) {
            throw new RuntimeException("You are not assigned to this task");
        }

        // Check if task is already completed
        if (task.getStatus() == TaskStatus.DONE || task.getStatus() == TaskStatus.CANCELLED) {
            throw new RuntimeException("Cannot extend completed or cancelled task");
        }

        // Check extension limit
        if (task.getExtensionCount() >= MAX_EXTENSIONS_PER_TASK) {
            throw new RuntimeException(
                    String.format("Maximum extensions reached (%d/%d). Cannot request more extensions.",
                            task.getExtensionCount(), MAX_EXTENSIONS_PER_TASK)
            );
        }

        // Check if there's already a pending extension request
        var existingPending = extensionRequestRepository
                .findFirstByTaskIdAndStatusOrderByRequestedAtDesc(taskId, ExtensionStatus.PENDING);

        if (existingPending.isPresent()) {
            throw new RuntimeException("There is already a pending extension request for this task");
        }

        // Convert LocalDate to LocalDateTime with end of day time (23:59:59)
        LocalDateTime newDueDateTime = request.getNewDueDate().atTime(23, 59, 59);

        // Validate new due date is after current due date
        if (newDueDateTime.isBefore(task.getDueDate()) || newDueDateTime.isEqual(task.getDueDate())) {
            throw new RuntimeException("New due date must be after current due date");
        }

        // Calculate hours between current and new due date
        long hoursDiff = Duration.between(task.getDueDate(), newDueDateTime).toHours();

        // Validate extension hours matches the date difference (allow 24 hour tolerance)
        if (Math.abs(hoursDiff - request.getExtensionHours()) > 24) {
            log.warn("Extension hours mismatch: requested={}, calculated from dates={}",
                    request.getExtensionHours(), hoursDiff);
        }

        // Create extension request
        TaskExtension extensionRequest = TaskExtension.builder()
                .taskId(taskId)
                .requestedBy(userId)
                .extensionHours(request.getExtensionHours())
                .newDueDate(newDueDateTime) // Lưu với thời gian 23:59:59
                .reason(request.getReason())
                .status(ExtensionStatus.PENDING)
                .build();

        extensionRequest = extensionRequestRepository.save(extensionRequest);

        log.info("Extension requested for task {}: {} hours, reason: {}",
                taskId, request.getExtensionHours(), request.getReason());

        // Send notification to team lead
        sendExtensionRequestNotification(task, extensionRequest);

        // Build response
        String requestedByName = getUserFullName(userId);
        TaskExtensionResponse response = extensionMapper.toResponse(
                extensionRequest, task, requestedByName, null);
        response.setMessage("Extension request submitted, awaiting approval");

        return response;
    }

    /**
     * Review extension request (approve/reject by team lead)
     */
    @Transactional
    public TaskExtensionResponse reviewExtensionRequest(
            String extensionRequestId,
            ExtensionReviewRequest reviewRequest) {

        String reviewerId = getCurrentUserId();

        TaskExtension extensionRequest = extensionRequestRepository.findById(extensionRequestId)
                .orElseThrow(() -> new RuntimeException("Extension request not found"));

        Task task = taskRepository.findById(extensionRequest.getTaskId())
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Verify reviewer has permission (team lead of the project)
        verifyApprovalPermission(task, reviewerId);

        // Check if already reviewed
        if (extensionRequest.getStatus() != ExtensionStatus.PENDING) {
            throw new RuntimeException("Extension request has already been reviewed");
        }

        // If reviewer provided a modified new due date, validate and apply it to the extension request
        if (reviewRequest.getNewDueDate() != null) {
            LocalDateTime reviewedNewDueDate = reviewRequest.getNewDueDate().atTime(23, 59, 59);

            // Ensure reviewed new due date is after current task due date
            if (reviewedNewDueDate.isBefore(task.getDueDate()) || reviewedNewDueDate.isEqual(task.getDueDate())) {
                throw new RuntimeException("Reviewed new due date must be after current task due date");
            }

            long hoursDiff = Duration.between(task.getDueDate(), reviewedNewDueDate).toHours();
            extensionRequest.setNewDueDate(reviewedNewDueDate);
            extensionRequest.setExtensionHours((int) Math.max(0, hoursDiff));
        }

        // Update extension request metadata
        extensionRequest.setStatus(reviewRequest.getStatus());
        extensionRequest.setReviewComments(reviewRequest.getReviewComments());
        extensionRequest.setReviewedBy(reviewerId);
        extensionRequest.setReviewedAt(LocalDateTime.now());

        extensionRequest = extensionRequestRepository.save(extensionRequest);

        String message;

        // If approved, update task
        if (reviewRequest.getStatus() == ExtensionStatus.APPROVED) {
            message = applyExtensionToTask(task, extensionRequest, reviewerId);
        } else {
            message = "Extension request rejected";
            log.info("Extension rejected for task {}: {}",
                    task.getId(), reviewRequest.getReviewComments());
        }

        // Send notification to employee
        sendExtensionReviewNotification(task, extensionRequest);

        // Build response
        String requestedByName = getUserFullName(extensionRequest.getRequestedBy());
        String reviewedByName = getUserFullName(reviewerId);

        TaskExtensionResponse response = extensionMapper.toResponse(
                extensionRequest, task, requestedByName, reviewedByName);
        response.setMessage(message);

        return response;
    }

    /**
     * Apply approved extension to task
     */
    /**
     * Apply approved extension to task - UPDATED LOGIC
     */
    private String applyExtensionToTask(
            Task task,
            TaskExtension extensionRequest,
            String approverId) {

        // Check extension limit
        if (task.getExtensionCount() >= MAX_EXTENSIONS_PER_TASK) {
            throw new RuntimeException("Maximum extensions reached");
        }

        LocalDateTime now = LocalDateTime.now();
        Integer oldEstimatedHours = task.getEstimatedHours();

        // 1. Update Due Date
        task.setDueDate(extensionRequest.getNewDueDate());

        // 2. [UPDATED] Auto-start Logic (Sync with TaskService)
        // Nếu task chưa có ngày bắt đầu, set là hiện tại
        if (task.getStartedAt() == null) {
            task.setStartedAt(now);
        }
        // Nếu task đang TODO, chuyển sang IN_PROGRESS
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }

        // 3. [UPDATED] Recalculate Estimated Hours based on Time Remaining
        // Logic cũ: Cộng dồn (task.getEstimatedHours() + extensionRequest.getExtensionHours())
        // Logic mới (theo yêu cầu): Lấy dueDate mới trừ cho thời điểm hiện tại
        if (extensionRequest.getNewDueDate().isAfter(now)) {
            long hoursDifference = Duration.between(now, extensionRequest.getNewDueDate()).toHours();
            int newEstimatedHours = (int) Math.max(0, hoursDifference);

            task.setEstimatedHours(newEstimatedHours);
            // Lưu ý: Không update originalEstimatedHours ở đây để giữ lịch sử gốc
        } else {
            // Trường hợp hy hữu newDueDate < now (dù đã validate)
            task.setEstimatedHours(0);
        }

        // 4. Update Extension Counters
        task.setExtensionCount(task.getExtensionCount() + 1);
        task.setTotalExtensionHours(task.getTotalExtensionHours() + extensionRequest.getExtensionHours());
        task.setLastExtensionDate(now);
        task.setHadExtension(true);

        // Add extension note to comments
        String extensionNote = String.format(
                "\n[EXTENSION %d] Approved by %s at %s. New Deadline: %s. Reason: %s",
                task.getExtensionCount(),
                getUserFullName(approverId),
                now.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                extensionRequest.getNewDueDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                extensionRequest.getReason()
        );
        task.setComments(
                (task.getComments() != null ? task.getComments() : "") + extensionNote
        );

        Task updatedTask = taskRepository.save(task);

        log.info("Extension approved for task {}: New DueDate: {}, New Estimated: {} hours",
                task.getId(), task.getDueDate(), task.getEstimatedHours());

        // Update workload service with new estimated hours
        try {
            // Truyền null cho oldEstimatedHours để workload service tự tính lại dựa trên task mới
            workloadIntegrationService.updateTaskWorkload(updatedTask, oldEstimatedHours, null, null);
            log.info("Workload service updated after extension approval for task: {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to update workload service after extension: {}", e.getMessage());
        }

        return String.format("Extension approved. New deadline: %s. Remaining hours updated to: %d",
                extensionRequest.getNewDueDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                task.getEstimatedHours());
    }

    /**
     * Get all extension requests for a task
     */
    public List<TaskExtensionResponse> getTaskExtensionRequests(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        List<TaskExtension> requests = extensionRequestRepository
                .findByTaskIdOrderByRequestedAtDesc(taskId);

        return requests.stream()
                .map(request -> {
                    String requestedByName = getUserFullName(request.getRequestedBy());
                    String reviewedByName = request.getReviewedBy() != null ?
                            getUserFullName(request.getReviewedBy()) : null;
                    return extensionMapper.toResponse(request, task, requestedByName, reviewedByName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get all extension requests by employee
     */
    public List<TaskExtensionResponse> getMyExtensionRequests(String userId) {
        List<TaskExtension> requests = extensionRequestRepository
                .findByRequestedByOrderByRequestedAtDesc(userId);

        return requests.stream()
                .map(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    if (task == null) return null;

                    String requestedByName = getUserFullName(request.getRequestedBy());
                    String reviewedByName = request.getReviewedBy() != null ?
                            getUserFullName(request.getReviewedBy()) : null;
                    return extensionMapper.toResponse(request, task, requestedByName, reviewedByName);
                })
                .filter(response -> response != null)
                .collect(Collectors.toList());
    }

    /**
     * Get all pending extension requests (for team leads)
     */
    public List<TaskExtensionResponse> getPendingExtensionRequests(String teamLeadId) {
        // Get all projects where this user is team lead
        var projectsResponse = projectServiceClient.getProjectsByTeamLead(teamLeadId);

        if (projectsResponse == null || projectsResponse.getResult() == null) {
            return List.of();
        }

        List<String> projectIds = projectsResponse.getResult().stream()
                .map(project -> project.getId())
                .collect(Collectors.toList());

        // Get all pending extension requests for tasks in these projects
        List<TaskExtension> allPendingRequests = extensionRequestRepository
                .findByStatusOrderByRequestedAtDesc(ExtensionStatus.PENDING);

        return allPendingRequests.stream()
                .filter(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    return task != null && projectIds.contains(task.getProjectId());
                })
                .map(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    String requestedByName = getUserFullName(request.getRequestedBy());
                    String reviewedByName = request.getReviewedBy() != null ?
                            getUserFullName(request.getReviewedBy()) : null;
                    return extensionMapper.toResponse(request, task, requestedByName, reviewedByName);
                })
                .collect(Collectors.toList());
    }

    public List<TaskExtensionResponse> getAllExtensionRequests(String teamLeadId) {
        // Get all projects where this user is team lead
        var projectsResponse = projectServiceClient.getProjectsByTeamLead(teamLeadId);

        if (projectsResponse == null || projectsResponse.getResult() == null) {
            return List.of();
        }

        List<String> projectIds = projectsResponse.getResult().stream()
                .map(project -> project.getId())
                .collect(Collectors.toList());

        // Get all pending extension requests for tasks in these projects
        List<ExtensionStatus> statuses = List.of(ExtensionStatus.PENDING, ExtensionStatus.APPROVED, ExtensionStatus.REJECTED);
        List<TaskExtension> allPendingRequests = extensionRequestRepository
                .findByStatusInOrderByRequestedAtDesc(statuses);

        return allPendingRequests.stream()
                .filter(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    return task != null && projectIds.contains(task.getProjectId());
                })
                .map(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    String requestedByName = getUserFullName(request.getRequestedBy());
                    String reviewedByName = request.getReviewedBy() != null ?
                            getUserFullName(request.getReviewedBy()) : null;
                    return extensionMapper.toResponse(request, task, requestedByName, reviewedByName);
                })
                .collect(Collectors.toList());
    }

    public List<TaskExtensionResponse> getApprovedExtensionRequests(String teamLeadId) {
        // Get all projects where this user is team lead
        var projectsResponse = projectServiceClient.getProjectsByTeamLead(teamLeadId);

        if (projectsResponse == null || projectsResponse.getResult() == null) {
            return List.of();
        }

        List<String> projectIds = projectsResponse.getResult().stream()
                .map(project -> project.getId())
                .collect(Collectors.toList());

        // Get all pending extension requests for tasks in these projects
        List<TaskExtension> allPendingRequests = extensionRequestRepository
                .findByStatusOrderByRequestedAtDesc(ExtensionStatus.APPROVED);

        return allPendingRequests.stream()
                .filter(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    return task != null && projectIds.contains(task.getProjectId());
                })
                .map(request -> {
                    Task task = taskRepository.findById(request.getTaskId()).orElse(null);
                    String requestedByName = getUserFullName(request.getRequestedBy());
                    String reviewedByName = request.getReviewedBy() != null ?
                            getUserFullName(request.getReviewedBy()) : null;
                    return extensionMapper.toResponse(request, task, requestedByName, reviewedByName);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get extension summary for a task
     */
    public TaskExtensionResponse getExtensionSummary(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        return TaskExtensionResponse.builder()
                .taskId(taskId)
                .taskTitle(task.getTitle())
                .originalEstimatedHours(task.getOriginalEstimatedHours())
                .currentEstimatedHours(task.getEstimatedHours())
                .originalDueDate(task.getOriginalDueDate())
                .currentDueDate(task.getDueDate())
                .extensionCount(task.getExtensionCount())
                .totalExtensionHours(task.getTotalExtensionHours())
                .remainingExtensions(MAX_EXTENSIONS_PER_TASK - task.getExtensionCount())
                .message(task.getHadExtension() ?
                        String.format("Task has been extended %d time(s)", task.getExtensionCount()) :
                        "No extensions")
                .build();
    }

    // Helper methods

    private void verifyApprovalPermission(Task task, String approverId) {
        try {
            var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
            String teamLeadId = projectResponse.getResult().getTeamLeadId();

            if (!teamLeadId.equals(approverId)) {
                throw new RuntimeException("Only team lead can review extension requests");
            }
        } catch (Exception e) {
            log.error("Failed to verify approval permission: {}", e.getMessage());
            throw new RuntimeException("Permission verification failed");
        }
    }

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

    private void sendExtensionRequestNotification(Task task, TaskExtension request) {
        try {
            // Get team lead info
            var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
            String teamLeadId = projectResponse.getResult().getTeamLeadId();
            String projectName = projectResponse.getResult().getName();

            // Get requester name
            String requestedByName = getUserFullName(request.getRequestedBy());

            // Send real-time notification
            RealTimeNotificationClient.TaskExtensionRequestNotificationRequest notificationRequest =
                    new RealTimeNotificationClient.TaskExtensionRequestNotificationRequest(
                            teamLeadId,
                            task.getId(),
                            task.getTitle(),
                            projectName,
                            request.getRequestedBy(),
                            requestedByName,
                            request.getExtensionHours(),
                            request.getNewDueDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                            request.getReason()
                    );

            realTimeNotificationClient.sendTaskExtensionRequestNotification(notificationRequest);

            log.info("Extension request notification sent to team lead: {}", teamLeadId);
        } catch (Exception e) {
            log.error("Failed to send extension request notification: {}", e.getMessage());
        }
    }

    private void sendExtensionReviewNotification(Task task, TaskExtension request) {
        try {
            // Get project name
            var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
            String projectName = projectResponse.getResult().getName();

            // Get reviewer name
            String reviewedByName = getUserFullName(request.getReviewedBy());

            // Format new due date
            String newDueDate = request.getNewDueDate() != null 
                    ? request.getNewDueDate().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"))
                    : "N/A";

            // Send real-time notification
            RealTimeNotificationClient.TaskExtensionReviewNotificationRequest notificationRequest =
                    new RealTimeNotificationClient.TaskExtensionReviewNotificationRequest(
                            request.getRequestedBy(),
                            task.getId(),
                            task.getTitle(),
                            projectName,
                            request.getReviewedBy(),
                            reviewedByName,
                            request.getStatus().name(),
                            request.getReviewComments(),
                            newDueDate
                    );

            realTimeNotificationClient.sendTaskExtensionReviewNotification(notificationRequest);

            log.info("Extension review notification sent to employee: {}", request.getRequestedBy());
        } catch (Exception e) {
            log.error("Failed to send extension review notification: {}", e.getMessage());
        }
    }
}
