package com.mnp.task.service;

import com.mnp.task.client.ProjectServiceClient;
import com.mnp.task.dto.request.*;
import com.mnp.task.dto.response.TaskDependencyResponse;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.dto.response.TaskSkillResponse;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskDependency;
import com.mnp.task.entity.TaskRequiredSkill;
import com.mnp.task.entity.TaskSubmission;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.enums.SubmissionStatus;
import com.mnp.task.exception.AppException;
import com.mnp.task.exception.ErrorCode;
import com.mnp.task.mapper.TaskMapper;
import com.mnp.task.repository.TaskDependencyRepository;
import com.mnp.task.repository.TaskRepository;
import com.mnp.task.repository.TaskRequiredSkillRepository;
import com.mnp.task.repository.TaskSubmissionRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    TaskRepository taskRepository;
    TaskDependencyRepository taskDependencyRepository;
    TaskRequiredSkillRepository taskRequiredSkillRepository;
    ProjectServiceClient projectServiceClient; // Assuming this is the client to communicate with the project service
    TaskSubmissionRepository taskSubmissionRepository;
    TaskMapper taskMapper;

    @Transactional
    public TaskResponse createTask(TaskCreationRequest request) {
        String creatorId = getCurrentUserId();
        log.info("Creating task for user {}", creatorId);
        // Create the main task
        Task task = taskMapper.toTask(request);
        task.setCreatedBy(creatorId);
        task.setAssignedTo(request.getAssigneeId());
        task.setReporterId(request.getReporterId());

        Task savedTask = taskRepository.save(task);
        log.info("Task created with ID: {}", savedTask.getId());

        // Create task dependencies if provided
        if (request.getDependencies() != null && !request.getDependencies().isEmpty()) {
            List<TaskDependency> dependencies = request.getDependencies().stream()
                    .map(depRequest -> TaskDependency.builder()
                            .taskId(savedTask.getId())
                            .dependsOnTaskId(depRequest.getDependsOnTaskId())
                            .type(depRequest.getType())
                            .build())
                    .toList();

            taskDependencyRepository.saveAll(dependencies);
            log.info("Created {} dependencies for task {}", dependencies.size(), savedTask.getId());
        }

        // Create task required skills if provided
        if (request.getRequiredSkills() != null && !request.getRequiredSkills().isEmpty()) {
            List<TaskRequiredSkill> requiredSkills = request.getRequiredSkills().stream()
                    .map(skillRequest -> TaskRequiredSkill.builder()
                            .taskId(savedTask.getId())
                            .skillType(skillRequest.getSkillType())
                            .requiredLevel(skillRequest.getRequiredLevel())
                            .skillName(skillRequest.getSkillName())
                            .mandatory(skillRequest.getMandatory())
                            .build())
                    .toList();

            taskRequiredSkillRepository.saveAll(requiredSkills);
            log.info("Created {} required skills for task {}", requiredSkills.size(), savedTask.getId());
        }

        // Automatically update project when task is created - moved outside conditional blocks
        updateProjectAfterTaskCreation(savedTask, request);

        return taskMapper.toTaskResponse(savedTask);
    }

    public TaskResponse updateTask(String taskId, TaskUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        taskMapper.updateTask(task, request);
        Task updatedTask = taskRepository.save(task);

        log.info("Task updated with ID: {}", updatedTask.getId());

        return taskMapper.toTaskResponse(updatedTask);
    }

    public void deleteTask(String taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new RuntimeException("Task not found");
        }

        taskRepository.deleteById(taskId);
        log.info("Task deleted with ID: {}", taskId);
    }

    public TaskResponse getTask(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TASK_NOT_FOUND));

        // Get the basic task response
        TaskResponse taskResponse = taskMapper.toTaskResponse(task);

        // Fetch and add required skills
        List<TaskRequiredSkill> requiredSkills = taskRequiredSkillRepository.findByTaskId(taskId);
        if (!requiredSkills.isEmpty()) {
            List<String> skillNames = requiredSkills.stream()
                    .map(TaskRequiredSkill::getSkillName)
                    .collect(Collectors.toList());
            taskResponse.setRequiredSkills(skillNames);
        }

        // Set task type and department for AI recommendation system
        // You can enhance this by adding these fields to the Task entity
        // For now, we'll infer from the task type and other data
        taskResponse.setTaskType(inferTaskType(task));
        taskResponse.setDepartment(inferDepartment(task, requiredSkills));
        taskResponse.setDifficulty(inferDifficulty(task, requiredSkills));

        return taskResponse;
    }

    /**
     * Infer task type from task data for AI recommendations
     */
    private String inferTaskType(Task task) {
        String type = task.getType() != null ? task.getType().toString().toLowerCase() : "";
        String title = task.getTitle() != null ? task.getTitle().toLowerCase() : "";
        String description = task.getDescription() != null ? task.getDescription().toLowerCase() : "";

        // Check for frontend indicators
        if (type.contains("frontend") || title.contains("frontend") || description.contains("frontend") ||
            title.contains("ui") || title.contains("react") || description.contains("react") ||
            title.contains("javascript") || description.contains("javascript")) {
            return "FRONTEND_DEVELOPMENT";
        }

        // Check for backend indicators
        if (type.contains("backend") || title.contains("backend") || description.contains("backend") ||
            title.contains("api") || title.contains("database") || description.contains("database") ||
            title.contains("spring") || description.contains("spring")) {
            return "BACKEND_DEVELOPMENT";
        }

        // Check for fullstack indicators
        if (type.contains("fullstack") || title.contains("fullstack") || description.contains("fullstack")) {
            return "FULLSTACK_DEVELOPMENT";
        }

        // Default to development type
        return "DEVELOPMENT";
    }

    /**
     * Infer department from task and skills data
     */
    private String inferDepartment(Task task, List<TaskRequiredSkill> requiredSkills) {
        // Check required skills for department indicators
        boolean hasFrontendSkills = requiredSkills.stream()
                .anyMatch(skill -> {
                    String skillName = skill.getSkillName().toLowerCase();
                    return skillName.contains("react") || skillName.contains("javascript") ||
                           skillName.contains("html") || skillName.contains("css") ||
                           skillName.contains("ui") || skillName.contains("ux");
                });

        boolean hasBackendSkills = requiredSkills.stream()
                .anyMatch(skill -> {
                    String skillName = skill.getSkillName().toLowerCase();
                    return skillName.contains("java") || skillName.contains("spring") ||
                           skillName.contains("python") || skillName.contains("node") ||
                           skillName.contains("database") || skillName.contains("sql");
                });

        if (hasFrontendSkills && !hasBackendSkills) {
            return "FE";
        } else if (hasBackendSkills && !hasFrontendSkills) {
            return "BE";
        } else if (hasFrontendSkills && hasBackendSkills) {
            return "FULLSTACK";
        }

        // Fallback to task type analysis
        String taskType = inferTaskType(task);
        if (taskType.contains("FRONTEND")) return "FE";
        if (taskType.contains("BACKEND")) return "BE";
        if (taskType.contains("FULLSTACK")) return "FULLSTACK";

        return "GENERAL";
    }

    /**
     * Infer difficulty from task characteristics
     */
    private String inferDifficulty(Task task, List<TaskRequiredSkill> requiredSkills) {
        int difficultyScore = 0;

        // Factor in estimated hours
        if (task.getEstimatedHours() != null) {
            if (task.getEstimatedHours() > 40) difficultyScore += 2;
            else if (task.getEstimatedHours() > 20) difficultyScore += 1;
        }

        // Factor in number of required skills
        difficultyScore += Math.min(requiredSkills.size() / 3, 2);

        // Factor in advanced skill requirements
        long advancedSkills = requiredSkills.stream()
                .filter(skill -> skill.getRequiredLevel() != null &&
                               skill.getRequiredLevel().toString().contains("ADVANCED"))
                .count();
        difficultyScore += (int) Math.min(advancedSkills, 2);

        // Factor in priority
        if (task.getPriority() != null) {
            String priority = task.getPriority().toString();
            if (priority.equals("HIGH") || priority.equals("URGENT")) difficultyScore += 1;
        }

        // Determine difficulty level
        if (difficultyScore >= 5) return "EXPERT";
        if (difficultyScore >= 3) return "HARD";
        if (difficultyScore >= 1) return "MEDIUM";
        return "EASY";
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    public List<TaskResponse> getTasksByAssignee(String assigneeId) {
        return taskRepository.findByAssignedTo(assigneeId).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    public List<TaskResponse> getTasksByCreator(String creatorId) {
        return taskRepository.findByCreatedBy(creatorId).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    public List<TaskResponse> getTasksByStatus(TaskStatus status) {
        return taskRepository.findByStatus(status).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    public List<TaskResponse> getMyTasks() {
        String currentUserId = getCurrentUserId();
        return taskRepository.findByAssignedTo(currentUserId).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    public List<TaskResponse> getMyCreatedTasks() {
        String currentUserId = getCurrentUserId();
        return taskRepository.findByCreatedBy(currentUserId).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    // Enhanced getAllTasks with filters
    public List<TaskResponse> getAllTasks(String projectId, TaskStatus status, String assigneeId) {
        List<Task> tasks;

        if (projectId != null && status != null && assigneeId != null) {
            tasks = taskRepository.findByProjectIdAndStatusAndAssignedTo(projectId, status, assigneeId);
        } else if (projectId != null && status != null) {
            tasks = taskRepository.findByProjectIdAndStatus(projectId, status);
        } else if (projectId != null && assigneeId != null) {
            tasks = taskRepository.findByProjectIdAndAssignedTo(projectId, assigneeId);
        } else if (status != null && assigneeId != null) {
            tasks = taskRepository.findByStatusAndAssignedTo(status, assigneeId);
        } else if (projectId != null) {
            tasks = taskRepository.findByProjectId(projectId);
        } else if (status != null) {
            tasks = taskRepository.findByStatus(status);
        } else if (assigneeId != null) {
            tasks = taskRepository.findByAssignedTo(assigneeId);
        } else {
            tasks = taskRepository.findAll();
        }

        return tasks.stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    // Enhanced getAllTasks with filters for project integration
    public List<TaskResponse> getAllTasksWithDetails(String projectId, TaskStatus status, String assigneeId) {
        List<Task> tasks;

        if (projectId != null && status != null && assigneeId != null) {
            tasks = taskRepository.findByProjectIdAndStatusAndAssignedTo(projectId, status, assigneeId);
        } else if (projectId != null && status != null) {
            tasks = taskRepository.findByProjectIdAndStatus(projectId, status);
        } else if (projectId != null && assigneeId != null) {
            tasks = taskRepository.findByProjectIdAndAssignedTo(projectId, assigneeId);
        } else if (status != null && assigneeId != null) {
            tasks = taskRepository.findByStatusAndAssignedTo(status, assigneeId);
        } else if (projectId != null) {
            tasks = taskRepository.findByProjectId(projectId);
        } else if (status != null) {
            tasks = taskRepository.findByStatus(status);
        } else if (assigneeId != null) {
            tasks = taskRepository.findByAssignedTo(assigneeId);
        } else {
            tasks = taskRepository.findAll();
        }

        return tasks.stream()
                .map(this::mapToDetailedTaskResponse)
                .toList();
    }

    // Task workflow methods
    @Transactional
    public TaskResponse updateTaskStatus(String taskId, TaskStatusUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(request.getStatus());

        // Update timestamps based on status
        if (request.getStatus() == TaskStatus.IN_PROGRESS && oldStatus == TaskStatus.TODO) {
            task.setStartedAt(LocalDateTime.now());
        } else if (request.getStatus() == TaskStatus.DONE) {
            task.setCompletedAt(LocalDateTime.now());
            task.setProgressPercentage(100.0);
        }

        if (request.getComments() != null) {
            task.setComments(request.getComments());
        }

        Task updatedTask = taskRepository.save(task);
        log.info("Task status updated: {} -> {} for task ID: {}", oldStatus, request.getStatus(), taskId);

        return taskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public TaskResponse assignTask(String taskId, String userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setAssignedTo(userId);
        Task updatedTask = taskRepository.save(task);

        log.info("Task assigned to user {} for task ID: {}", userId, taskId);
        return taskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public TaskResponse updateTaskProgress(String taskId, TaskProgressUpdateRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setProgressPercentage(request.getProgressPercentage().doubleValue());

        if (request.getActualHoursSpent() != null) {
            task.setActualHours(request.getActualHoursSpent());
        }

        if (request.getComments() != null) {
            task.setComments(request.getComments());
        }

        // Auto-update status based on progress
        if (request.getProgressPercentage() == 0) {
            task.setStatus(TaskStatus.TODO);
        } else if (request.getProgressPercentage() < 100 && task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            task.setStartedAt(LocalDateTime.now());
        } else if (request.getProgressPercentage() == 100) {
            task.setStatus(TaskStatus.DONE);
            task.setCompletedAt(LocalDateTime.now());
        }

        Task updatedTask = taskRepository.save(task);
        log.info("Task progress updated to {}% for task ID: {}", request.getProgressPercentage(), taskId);

        return taskMapper.toTaskResponse(updatedTask);
    }

    // Task dependencies methods
    public List<TaskDependencyResponse> getTaskDependencies(String taskId) {
        List<TaskDependency> dependencies = taskDependencyRepository.findByTaskId(taskId);
        return dependencies.stream()
                .map(this::mapToTaskDependencyResponse)
                .toList();
    }

    @Transactional
    public TaskDependencyResponse addTaskDependency(String taskId, TaskDependencyRequest request) {
        // Validate task exists
        taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate dependency task exists
        taskRepository.findById(request.getDependsOnTaskId())
                .orElseThrow(() -> new RuntimeException("Dependency task not found"));

        // Check if dependency already exists
        if (taskDependencyRepository.existsByTaskIdAndDependsOnTaskId(taskId, request.getDependsOnTaskId())) {
            throw new RuntimeException("Dependency already exists");
        }

        // Prevent circular dependencies (simple check)
        if (taskId.equals(request.getDependsOnTaskId())) {
            throw new RuntimeException("Task cannot depend on itself");
        }

        TaskDependency dependency = TaskDependency.builder()
                .taskId(taskId)
                .dependsOnTaskId(request.getDependsOnTaskId())
                .type(request.getType())
                .build();

        TaskDependency savedDependency = taskDependencyRepository.save(dependency);
        log.info("Task dependency added: task {} depends on task {}", taskId, request.getDependsOnTaskId());

        return mapToTaskDependencyResponse(savedDependency);
    }

    @Transactional
    public void removeTaskDependency(String taskId, String dependencyId) {
        TaskDependency dependency = taskDependencyRepository.findById(dependencyId)
                .orElseThrow(() -> new RuntimeException("Dependency not found"));

        if (!dependency.getTaskId().equals(taskId)) {
            throw new RuntimeException("Dependency does not belong to this task");
        }

        taskDependencyRepository.delete(dependency);
        log.info("Task dependency removed: {}", dependencyId);
    }

    // Task skills methods
    public List<TaskSkillResponse> getTaskSkills(String taskId) {
        List<TaskRequiredSkill> skills = taskRequiredSkillRepository.findByTaskId(taskId);
        return skills.stream()
                .map(this::mapToTaskSkillResponse)
                .toList();
    }

    @Transactional
    public TaskSkillResponse addTaskSkill(String taskId, TaskSkillRequest request) {
        // Validate task exists
        taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        TaskRequiredSkill skill = TaskRequiredSkill.builder()
                .taskId(taskId)
                .skillType(request.getSkillType())
                .requiredLevel(request.getRequiredLevel())
                .skillName(request.getSkillName())
                .build();

        TaskRequiredSkill savedSkill = taskRequiredSkillRepository.save(skill);
        log.info("Skill requirement added to task {}: {}", taskId, request.getSkillType());

        return mapToTaskSkillResponse(savedSkill);
    }

    @Transactional
    public void removeTaskSkill(String taskId, String skillId) {
        TaskRequiredSkill skill = taskRequiredSkillRepository.findById(skillId)
                .orElseThrow(() -> new RuntimeException("Skill requirement not found"));

        if (!skill.getTaskId().equals(taskId)) {
            throw new RuntimeException("Skill requirement does not belong to this task");
        }

        taskRequiredSkillRepository.delete(skill);
        log.info("Skill requirement removed: {}", skillId);
    }

    // Task submission methods
    @Transactional
    public TaskSubmissionResponse submitTask(String taskId, TaskSubmissionRequest request) {
        String currentUserId = getCurrentUserId();

        // Validate task exists and user is assigned
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!currentUserId.equals(task.getAssignedTo())) {
            throw new RuntimeException("Only assigned user can submit the task");
        }

        // Check if already submitted
        if (taskSubmissionRepository.findByTaskIdAndSubmittedBy(taskId, currentUserId).isPresent()) {
            throw new RuntimeException("Task already submitted by this user");
        }

        TaskSubmission submission = TaskSubmission.builder()
                .taskId(taskId)
                .submittedBy(currentUserId)
                .description(request.getDescription())
                .attachmentUrl(request.getAttachmentUrl())
                .status(SubmissionStatus.PENDING)
                .build();

        TaskSubmission savedSubmission = taskSubmissionRepository.save(submission);
        log.info("Task submitted for review: task {}, submitted by {}", taskId, currentUserId);

        return mapToTaskSubmissionResponse(savedSubmission);
    }

    public List<TaskSubmissionResponse> getTaskSubmissions(String taskId) {
        List<TaskSubmission> submissions = taskSubmissionRepository.findByTaskId(taskId);
        return submissions.stream()
                .map(this::mapToTaskSubmissionResponse)
                .toList();
    }

    @Transactional
    public TaskSubmissionResponse reviewSubmission(String submissionId, SubmissionReviewRequest request) {
        String currentUserId = getCurrentUserId();

        TaskSubmission submission = taskSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new RuntimeException("Submission not found"));

        // Validate task exists and user can review (task creator or project manager)
        Task task = taskRepository.findById(submission.getTaskId())
                .orElseThrow(() -> new RuntimeException("Task not found"));

        if (!currentUserId.equals(task.getCreatedBy())) {
            // You might want to add more complex authorization logic here
            // For now, only task creator can review
            throw new RuntimeException("Only task creator can review submissions");
        }

        submission.setStatus(request.getStatus());
        submission.setReviewComments(request.getReviewComments());
        submission.setReviewedBy(currentUserId);
        submission.setReviewedAt(LocalDateTime.now());

        // Update task status based on review
        if (request.getStatus() == SubmissionStatus.APPROVED) {
            task.setStatus(TaskStatus.DONE);
            task.setCompletedAt(LocalDateTime.now());
            task.setProgressPercentage(100.0);
            taskRepository.save(task);
        }

        TaskSubmission updatedSubmission = taskSubmissionRepository.save(submission);
        log.info("Submission reviewed: {} -> {}", submissionId, request.getStatus());

        return mapToTaskSubmissionResponse(updatedSubmission);
    }

    public List<TaskSubmissionResponse> getPendingSubmissions() {
        List<TaskSubmission> submissions = taskSubmissionRepository.findByStatus(SubmissionStatus.PENDING);
        return submissions.stream()
                .map(this::mapToTaskSubmissionResponse)
                .toList();
    }

    public List<TaskSubmissionResponse> getMyReviews() {
        String currentUserId = getCurrentUserId();
        List<TaskSubmission> submissions = taskSubmissionRepository.findByReviewedBy(currentUserId);
        return submissions.stream()
                .map(this::mapToTaskSubmissionResponse)
                .toList();
    }

    // Helper mapping methods
    private TaskDependencyResponse mapToTaskDependencyResponse(TaskDependency dependency) {
        Task dependentTask = taskRepository.findById(dependency.getDependsOnTaskId()).orElse(null);

        return TaskDependencyResponse.builder()
                .id(dependency.getId())
                .taskId(dependency.getTaskId())
                .dependsOnTaskId(dependency.getDependsOnTaskId())
                .dependsOnTaskTitle(dependentTask != null ? dependentTask.getTitle() : "Unknown Task")
                .type(dependency.getType())
                .createdAt(dependency.getCreatedAt())
                .build();
    }

    private TaskSkillResponse mapToTaskSkillResponse(TaskRequiredSkill skill) {
        return TaskSkillResponse.builder()
                .id(skill.getId())
                .taskId(skill.getTaskId())
                .skillType(skill.getSkillType())
                .requiredLevel(skill.getRequiredLevel())
                .skillName(skill.getSkillName())
                .build();
    }

    private TaskSubmissionResponse mapToTaskSubmissionResponse(TaskSubmission submission) {
        Task task = taskRepository.findById(submission.getTaskId()).orElse(null);

        return TaskSubmissionResponse.builder()
                .id(submission.getId())
                .taskId(submission.getTaskId())
                .taskTitle(task != null ? task.getTitle() : "Unknown Task")
                .submittedBy(submission.getSubmittedBy())
                .submittedByName(submission.getSubmittedBy()) // You might want to fetch actual names from user service
                .description(submission.getDescription())
                .attachmentUrl(submission.getAttachmentUrl())
                .status(submission.getStatus())
                .reviewComments(submission.getReviewComments())
                .reviewedBy(submission.getReviewedBy())
                .reviewedByName(submission.getReviewedBy()) // You might want to fetch actual names from user service
                .reviewedAt(submission.getReviewedAt())
                .submittedAt(submission.getSubmittedAt())
                .build();
    }

    private TaskResponse mapToDetailedTaskResponse(Task task) {
        // Get task dependencies
        List<TaskDependency> dependencies = taskDependencyRepository.findByTaskId(task.getId());
        List<TaskDependencyResponse> dependencyResponses = dependencies.stream()
                .map(this::mapToTaskDependencyResponse)
                .toList();

        // Get task required skills
        List<TaskRequiredSkill> skills = taskRequiredSkillRepository.findByTaskId(task.getId());
        List<TaskSkillResponse> skillResponses = skills.stream()
                .map(this::mapToTaskSkillResponse)
                .toList();

        // Use the existing mapper and enhance with additional data
        TaskResponse response = taskMapper.toTaskResponse(task);

        // Add dependencies and skills to the response (assuming TaskResponse has these fields)
        // Note: You may need to modify TaskResponse to include these fields
        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .projectId(task.getProjectId())
                .createdBy(task.getCreatedBy())
                .assignedTo(task.getAssignedTo())
                .assigneeId(task.getAssignedTo()) // Add this missing field
                .reporterId(task.getReporterId())
                .type(task.getType().name())
                .priority(task.getPriority())
                .status(task.getStatus())
                .progressPercentage(task.getProgressPercentage())
                .tags(task.getTags())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .dueDate(task.getDueDate())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .dependencies(dependencyResponses.toArray(new TaskDependencyResponse[0]))
                .build();
    }

    private String getCurrentUserId() {
        var context = SecurityContextHolder.getContext();
        var authentication = context.getAuthentication();

        // Handle cases where there's no authentication context (internal calls)
        if (authentication == null || authentication.getName() == null || "anonymousUser".equals(authentication.getName())) {
            return "SYSTEM"; // Return a default value for internal calls
        }

        return authentication.getName();
    }

    /**
     * Update project information after task creation:
     * 1. Increment totalTasks count
     * 2. Update project required skills
     * 3. Add assignee as project member if not already a member
     */
    private void updateProjectAfterTaskCreation(Task task, TaskCreationRequest request) {
        try {
            String projectId = task.getProjectId();

            // 1. Increment total tasks count in project
            log.info("Updating project {} - incrementing total tasks", projectId);
            projectServiceClient.incrementTotalTasks(projectId);

            // 2. Update project required skills if task has skills
            if (request.getRequiredSkills() != null && !request.getRequiredSkills().isEmpty()) {
                List<String> skillsToAdd = request.getRequiredSkills().stream()
                        .map(skill -> skill.getSkillType().name() + "_" + skill.getSkillName())
                        .collect(Collectors.toList());

                UpdateProjectSkillsRequest skillsRequest = UpdateProjectSkillsRequest.builder()
                        .skillsToAdd(skillsToAdd)
                        .build();

                log.info("Updating project {} - adding skills: {}", projectId, skillsToAdd);
                projectServiceClient.updateProjectSkills(projectId, skillsRequest);
            }

            // 3. Add assignee as project member if assigned
            if (task.getAssignedTo() != null && !task.getAssignedTo().isEmpty()) {
                AddProjectMemberRequest memberRequest = AddProjectMemberRequest.builder()
                        .projectId(projectId)
                        .userId(task.getAssignedTo())
                        .role("DEVELOPER") // Default role for task assignees
                        .joinedAt(LocalDateTime.now())
                        .build();

                log.info("Adding user {} as member to project {}", task.getAssignedTo(), projectId);
                projectServiceClient.addMemberToProject(memberRequest);
            }

        } catch (Exception e) {
            log.error("Failed to update project {} after task creation: {}", task.getProjectId(), e.getMessage());
            // Don't fail the task creation if project update fails
        }
    }
}
