package com.mnp.task.service;

import com.mnp.task.client.IdentityClient;
import com.mnp.task.client.ProjectServiceClient;
import com.mnp.task.client.ChatServiceClient;
import com.mnp.task.client.RealTimeNotificationClient;
import com.mnp.task.dto.request.*;
import com.mnp.task.dto.response.ApiResponse;
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
import com.mnp.task.mapper.TaskSubmissionMapper;
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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskService {

    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    TaskRepository taskRepository;
    TaskDependencyRepository taskDependencyRepository;
    TaskRequiredSkillRepository taskRequiredSkillRepository;
    ProjectServiceClient projectServiceClient;
    TaskSubmissionRepository taskSubmissionRepository;
    TaskSubmissionMapper taskSubmissionMapper;
    TaskMapper taskMapper;
    TaskNotificationProducerService taskNotificationProducerService;
    TaskSocketIOService taskSocketIOService; // Add Socket.IO service
    ProjectIntegrationService projectIntegrationService; // Add the new integration service
    ChatServiceClient chatServiceClient; // Add chat service client
    private final RealTimeNotificationClient realTimeNotificationClient; // Add real-time notification client
    IdentityClient identityClient;


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

        // **INCREMENT TOTAL TASKS IN PROJECT**
        try {
            projectServiceClient.incrementTotalTasks(savedTask.getProjectId());
            log.info("Incremented totalTasks for project: {}", savedTask.getProjectId());
        } catch (Exception e) {
            log.error("Failed to increment totalTasks for project: {}", savedTask.getProjectId(), e);
        }

        // Send notification to assigned employee
        if (savedTask.getAssignedTo() != null) {
            try {
                String assignedByName = getCurrentUserName();
                String dueDate = savedTask.getDueDate() != null ?
                        savedTask.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Not specified";
                String projectName = getProjectNameById(savedTask.getProjectId());

                // Send traditional notification
                taskNotificationProducerService.sendTaskAssignmentNotification(
                        savedTask.getAssignedTo(),
                        savedTask.getId(),
                        savedTask.getTitle(),
                        projectName,
                        assignedByName,
                        dueDate
                );

                // Send real-time notification
                sendRealTimeTaskAssignmentNotification(savedTask, projectName, assignedByName, dueDate);

                log.info("Sent task assignment notification for task: {}", savedTask.getId());
            } catch (Exception e) {
                log.error("Failed to send task assignment notification for task: {}", savedTask.getId(), e);
            }

            // Add assignee to project members when task is assigned during creation
            projectIntegrationService.addProjectMemberFromTaskAssignment(
                savedTask.getProjectId(),
                savedTask.getAssignedTo()
            );

            // Add user to chat group for the project
            addToProjectChatGroup(savedTask.getProjectId(), savedTask.getAssignedTo());
        }

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

        // Create task required skills if provided and update project skills
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

            // Update project required skills based on task skills
            projectIntegrationService.updateProjectSkillsFromTask(
                savedTask.getProjectId(),
                requiredSkills
            );
        }

        return taskMapper.toTaskResponse(savedTask);
    }

    /**
     * Get user full name by user ID
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

    public String getTaskName(String taskId){
        try {
            var response = taskRepository.findById(taskId);
            if (response != null && response.isPresent()) {
                return response.get().getTitle();
            }
            return "Unknown Task";
        } catch (Exception e) {
            log.warn("Failed to get task name for ID {}: {}", taskId, e.getMessage());
            return "Unknown Task";
        }
    }

    /**
     * Get user full name by user ID - Ultra safe version that never breaks system functionality
     */
    private String getUserFullNameSafely(String userId) {
        // For system or admin users, avoid making external calls that could break login
        if (userId == null || userId.trim().isEmpty() || "SYSTEM".equals(userId)) {
            return "System User";
        }

        try {
            // Check if this is being called during login/authentication flow
            var context = SecurityContextHolder.getContext();
            var authentication = context.getAuthentication();

            // If no proper authentication context, don't make external calls
            if (authentication == null || "anonymousUser".equals(authentication.getName())) {
                return "User " + userId;
            }

            var response = identityClient.getFullName(userId);
            if (response != null && response.getResult() != null) {
                String firstName = response.getResult().getFirstName();
                String lastName = response.getResult().getLastName();

                if (firstName != null && lastName != null) {
                    return firstName + " " + lastName;
                }
            }
            return "User " + userId; // Fallback to show user ID if name fetch fails
        } catch (Exception e) {
            log.debug("Could not fetch user name for ID {} (using fallback): {}", userId, e.getMessage());
            return "User " + userId; // Safe fallback that won't break the system
        }
    }

    public TaskResponse updateTask(String taskId, TaskUpdateRequest request) {
        log.info("Updating task request: {}", request);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String oldAssigneeId = task.getAssignedTo();
        String oldAssigneeName = getUserFullName(oldAssigneeId);
        taskMapper.updateTask(task, request);
        Task updatedTask = taskRepository.save(task);

        // Handle task reassignment logic
        if (updatedTask.getAssignedTo() != null &&!updatedTask.getAssignedTo().equals(oldAssigneeId)) {

            String newAssigneeId = updatedTask.getAssignedTo();
            try {
                String assignedByName = getUserFullName(newAssigneeId);
                String dueDate = updatedTask.getDueDate() != null ?
                        updatedTask.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")) : "Not specified";
                String projectName = getProjectNameById(updatedTask.getProjectId());
                var projectResponse = projectServiceClient.getProjectById(task.getProjectId());


                String teamLeadName = getUserFullName(projectResponse.getResult().getTeamLeadId());

                // Create task response for notifications
                TaskResponse taskResponse = taskMapper.toTaskResponse(updatedTask);

                // Check if new assignee is already a project member
                ApiResponse<Boolean> response = projectServiceClient.isUserInProject(
                        updatedTask.getProjectId(),
                        newAssigneeId
                );
                boolean isNewAssigneeInProject = response.getResult();

                if (!isNewAssigneeInProject) {
                    // User B is NOT in project - add them to project and chat group
                    log.info("New assignee {} is not in project {}, adding to project members and chat group", newAssigneeId, updatedTask.getProjectId());

                    // Add new assignee to project members
                    projectIntegrationService.addProjectMemberFromTaskAssignment(
                        updatedTask.getProjectId(),
                        newAssigneeId
                    );

                    // Add user to chat group for the project
                    addToProjectChatGroup(updatedTask.getProjectId(), newAssigneeId);

                    log.info("Added user {} to project and sent task assignment notification", newAssigneeId);
                } else {
                    // User B is already in project - just send notification
                    log.info("New assignee {} is already in project {}, sending task assignment notification only", newAssigneeId, updatedTask.getProjectId());

                    // Send Socket.IO notification for task assignment to new user
                }

                taskSocketIOService.notifyTaskAssigned(taskResponse, projectName, teamLeadName);

                // Send real-time notification for new assignee
                sendRealTimeTaskAssignmentNotification(updatedTask, projectName, assignedByName, dueDate);

                // Notify old assignee about task transfer if there was a previous assignee
                if (oldAssigneeId != null && !oldAssigneeId.isEmpty()) {
                    try {
                        String newAssigneeName = getUserFullNameSafely(newAssigneeId);
                        taskSocketIOService.notifyTaskTransferred(oldAssigneeId, newAssigneeName, taskResponse);
                        sendRealTimeTaskAssignmentTransferNotification(oldAssigneeId, updatedTask.getTitle(), projectName, assignedByName, oldAssigneeName, dueDate);
                        log.info("Sent task transfer notification to previous assignee: {} - Task '{}' transferred to {}",
                                oldAssigneeId, updatedTask.getTitle(), newAssigneeName);
                    } catch (Exception e) {
                        log.error("Failed to send task transfer notification to previous assignee {}: {}", oldAssigneeId, e.getMessage());
                        // Continue execution even if transfer notification fails
                    }
                }

                log.info("Successfully completed task reassignment from {} to {} for task: {}",
                        oldAssigneeId, newAssigneeId, updatedTask.getId());

            } catch (Exception e) {
                log.error("Failed to complete task reassignment for task: {}", updatedTask.getId(), e);
                // Don't fail the entire update if notifications fail
            }
        }

        log.info("Task updated with ID: {}", updatedTask.getId());

        return taskMapper.toTaskResponse(updatedTask);
    }

    @Transactional
    public void deleteTask(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String projectId = task.getProjectId();
        TaskStatus taskStatus = task.getStatus();

        taskRepository.deleteById(taskId);
        log.info("Task deleted with ID: {}", taskId);

        // **DECREMENT TOTAL TASKS IN PROJECT**
        try {
            projectServiceClient.decrementTotalTasks(projectId);
            log.info("Decremented totalTasks for project: {}", projectId);

            // If the deleted task was DONE, also decrement completedTasks
            if (taskStatus == TaskStatus.DONE) {
                projectServiceClient.decrementCompletedTasks(projectId);
                log.info("Decremented completedTasks for project: {}", projectId);
            }
        } catch (Exception e) {
            log.error("Failed to update project counters for project: {}", projectId, e);
        }
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

    public List<TaskResponse> getMyTasks() {

        String currentUserId = getCurrentUserId();
        log.info("Getting my tasks for user: {}", currentUserId);
        return taskRepository.findByAssignedTo(currentUserId).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }


    public List<TaskResponse> getTasksForTeamLead(String teamLeadId) {
        try {
            // Get projects where this user is a team lead
            com.mnp.task.dto.response.ApiResponse<java.util.List<com.mnp.task.dto.response.ProjectResponse>> response =
                    projectServiceClient.getProjectsByTeamLead(teamLeadId);

            if (response == null || response.getResult() == null) {
                log.warn("No projects found for team lead: {}", teamLeadId);
                return List.of(); // Return empty list if no projects found
            }

            List<String> projectIds = response.getResult().stream()
                    .map(com.mnp.task.dto.response.ProjectResponse::getId)
                    .collect(Collectors.toList());

            if (projectIds.isEmpty()) {
                return List.of(); // Return empty list if no projects found
            }

            // Get all tasks from these projects
            return taskRepository.findByProjectIdIn(projectIds).stream()
                    .map(taskMapper::toTaskResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Failed to fetch tasks for team lead {}: {}", teamLeadId, e.getMessage());
            return List.of(); // Return empty list on error
        }
    }

    public List<TaskResponse> getTasksForUser(String userId, String userRole) {
        if ("TEAM_LEAD".equals(userRole)) {
            return getTasksForTeamLead(userId);
        } else {
            return getAllTasks();
        }
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
            // Removed automatic progressPercentage = 100% to preserve employee self-evaluation
            // Progress percentage should reflect employee's honest self-assessment for ML training accuracy
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

        // Store the old assignedTo for comparison
        String previousAssignedTo = task.getAssignedTo();

        // Update task assignment
        task.setAssignedTo(userId);
        Task updatedTask = taskRepository.save(task);

        log.info("Task assigned to user {} for task ID: {}", userId, taskId);

        // If this is a new assignment (not just updating existing assignment)
        if (!userId.equals(previousAssignedTo)) {
            try {
                // Add user to project members table if task has a project
                if (task.getProjectId() != null && !task.getProjectId().isEmpty()) {
                    addUserToProjectMembers(task.getProjectId(), userId);

                    // Add user to project group chat
                    addUserToProjectGroupChat(task.getProjectId(), userId);
                }
            } catch (Exception e) {
                log.error("Error during task assignment integrations for task {} and user {}: {}",
                         taskId, userId, e.getMessage(), e);
                // Continue execution even if integrations fail to avoid breaking task assignment
            }
        }

        TaskResponse taskResponse = taskMapper.toTaskResponse(updatedTask);

        // Send real-time Socket.IO notification for task assignment
        try {
//            taskSocketIOService.notifyTaskAssigned(taskResponse);
            log.info("Real-time task assignment notification sent via Socket.IO for task: {}", taskId);
        } catch (Exception e) {
            log.error("Failed to send real-time task assignment notification for task {}: {}", taskId, e.getMessage());
            // Don't fail task assignment if Socket.IO notification fails
        }

        return taskResponse;
    }

    /**
     * Add user to project members table
     */
    private void addUserToProjectMembers(String projectId, String userId) {
        try {
            log.info("Adding user {} to project {} members", userId, projectId);

            AddProjectMemberRequest memberRequest = AddProjectMemberRequest.builder()
                    .projectId(projectId)
                    .userId(userId)
                    .role("MEMBER") // Default role for task assignments
                    .build();

            projectServiceClient.addMemberToProject(memberRequest);
            log.info("Successfully added user {} to project {} members", userId, projectId);

        } catch (Exception e) {
            log.error("Failed to add user {} to project {} members: {}", userId, projectId, e.getMessage(), e);
            throw e; // Re-throw to be caught by calling method
        }
    }

    /**
     * Add user to project group chat
     */
    private void addUserToProjectGroupChat(String projectId, String userId) {
        try {
            log.info("Adding user {} to project {} group chat", userId, projectId);

            // Call chat service to add user to the project group using the standardized endpoint
            chatServiceClient.addMemberToProjectGroup(projectId, userId);
            taskSocketIOService.notifyAddedToChatProject(projectId, userId);
            log.info("Successfully added user {} to project {} group chat", userId, projectId);

        } catch (Exception e) {
            log.error("Failed to add user {} to project {} group chat: {}", userId, projectId, e.getMessage(), e);
            throw e; // Re-throw to be caught by calling method
        }
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

        String projectName = "Unknown Project";
        String teamLeadName = "Unknown Team Lead";

        // Use safe methods to get user names to prevent admin access issues
        String submitByName = getUserFullNameSafely(submission.getSubmittedBy());
        String reviewByName = getUserFullNameSafely(submission.getReviewedBy());

        try {
            if (task != null && task.getProjectId() != null) {
                // Get project information
                var projectResponse = projectServiceClient.getProjectById(task.getProjectId());
                if (projectResponse != null && projectResponse.getResult() != null) {
                    var project = projectResponse.getResult();
                    projectName = project.getName() != null ? project.getName() : "Unknown Project";

                    // Get team lead name safely
                    String teamLeadId = project.getTeamLeadId();
                    if (teamLeadId != null && !teamLeadId.isEmpty()) {
                        teamLeadName = getUserFullNameSafely(teamLeadId);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch project information for task {}: {}", submission.getTaskId(), e.getMessage());
        }

        return taskSubmissionMapper.toTaskSubmissionResponse(submission, projectName, teamLeadName, submitByName, reviewByName);
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

    /**
     * Send task reminder notifications to employees
     */
    public void sendTaskReminders() {
        try {
            // Find tasks that are due within 24 hours and not completed
            var upcomingTasks = taskRepository.findTasksDueWithin24Hours();

            for (Task task : upcomingTasks) {
                if (task.getAssignedTo() != null) {
                    String dueDate = task.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
                    String projectName = getProjectNameById(task.getProjectId());

                    taskNotificationProducerService.sendTaskReminderNotification(
                            task.getAssignedTo(),
                            task.getId(),
                            task.getTitle(),
                            projectName,
                            dueDate
                    );
                }
            }
            log.info("Sent {} task reminder notifications", upcomingTasks.size());
        } catch (Exception e) {
            log.error("Failed to send task reminder notifications", e);
        }
    }

    /**
     * Get project name by project ID using project service client
     */
    private String getProjectNameById(String projectId) {
        try {
            if (projectId == null || projectId.trim().isEmpty()) {
                log.warn("Project ID is null or empty");
                return "Unknown Project";
            }

            log.debug("Fetching project details for ID: {}", projectId);
            // Call project service to get project details
            com.mnp.task.dto.response.ApiResponse<com.mnp.task.dto.response.ProjectResponse> response =
                    projectServiceClient.getProjectById(projectId);

            if (response != null && response.getResult() != null &&
                response.getResult().getName() != null && !response.getResult().getName().trim().isEmpty()) {
                String projectName = response.getResult().getName();
                log.debug("Successfully retrieved project name: {} for ID: {}", projectName, projectId);
                return projectName;
            } else {
                log.warn("Project service returned null or empty name for project ID: {} - Response: {}", projectId, response);
                return "Unknown Project";
            }
        } catch (Exception e) {
            log.error("Failed to fetch project name for ID: {} - Error: {}", projectId, e.getMessage(), e);
            return "Unknown Project";
        }
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

    private String getCurrentUserName() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

    /**
     * Add user to project chat group with system messages
     */
    private void addToProjectChatGroup(String projectId, String userId) {
        try {
            // Call chat service to add user to the project group using the standardized endpoint
            chatServiceClient.addMemberToProjectGroup(projectId, userId);
            log.info("User {} added to project {} chat group", userId, projectId);

            // Send real-time notification about group chat addition
            sendRealTimeGroupChatNotification(projectId, userId);
        } catch (Exception e) {
            log.error("Failed to add user {} to project {} chat group: {}", userId, projectId, e.getMessage());
            // Don't fail task assignment if chat group addition fails
        }
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
        } else if (request.getProgressPercentage() == 100) {
            task.setStatus(TaskStatus.DONE);
            task.setCompletedAt(LocalDateTime.now());
        } else if (request.getProgressPercentage() > 0) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            if (task.getStartedAt() == null) {
                task.setStartedAt(LocalDateTime.now());
            }
        }

        Task updatedTask = taskRepository.save(task);
        log.info("Task progress updated: {}% for task ID: {}", request.getProgressPercentage(), taskId);

        return taskMapper.toTaskResponse(updatedTask);
    }

    /**
     * Send real-time task assignment notification
     */
    private void sendRealTimeTaskAssignmentNotification(Task task, String projectName, String assignedByName, String dueDate) {
        try {
            RealTimeNotificationClient.TaskAssignmentNotificationRequest request =
                new RealTimeNotificationClient.TaskAssignmentNotificationRequest(
                    task.getAssignedTo(),
                    task.getId(),
                    task.getTitle(),
                    projectName,
                    assignedByName,
                    dueDate
                );

            realTimeNotificationClient.sendTaskAssignmentNotification(request);
            log.info("Real-time task assignment notification sent for task: {}", task.getId());
        } catch (Exception e) {
            log.error("Failed to send real-time task assignment notification for task: {}", task.getId(), e);
        }
    }

    private void sendRealTimeTaskAssignmentTransferNotification(String employeeId,String taskTitle, String projectName, String newAssignBy, String oldAssignBy, String dueDate) {
        try {
            RealTimeNotificationClient.TaskTransferNotificationRequest request =
                    new RealTimeNotificationClient.TaskTransferNotificationRequest(
                            employeeId,
                            taskTitle,
                            projectName,
                            newAssignBy,
                            oldAssignBy,
                            dueDate
                    );

            realTimeNotificationClient.sendTaskTransferNotification(request);
            log.info("Real-time task assignment notification sent for task: {}", taskTitle);
        } catch (Exception e) {
            log.error("Failed to send real-time task assignment notification for task: {}", taskTitle, e);
        }
    }

    /**
     * Send real-time group chat addition notification
     */
    private void sendRealTimeGroupChatNotification(String projectId, String userId) {
        try {
            String projectName = getProjectNameById(projectId);
            String currentUserName = getCurrentUserName();

            RealTimeNotificationClient.GroupChatAdditionNotificationRequest request =
                new RealTimeNotificationClient.GroupChatAdditionNotificationRequest(
                    userId,
                    projectId,
                    projectName,
                    currentUserName,
                    projectName + " Chat Group"
                );

            realTimeNotificationClient.sendGroupChatAdditionNotification(request);
            log.info("Real-time group chat addition notification sent for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to send real-time group chat addition notification for user: {}", userId, e);
        }
    }
}
