package com.mnp.task.service;

import com.mnp.task.client.IdentityClient;
import com.mnp.task.client.ProjectServiceClient;
import com.mnp.task.client.ChatServiceClient;
import com.mnp.task.client.RealTimeNotificationClient;
import com.mnp.task.dto.request.*;
import com.mnp.task.dto.response.*;
import com.mnp.task.dto.response.ApiResponse;
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

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.DayOfWeek;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.function.Function;
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
    WorkloadIntegrationService workloadIntegrationService; // Add workload integration service

    private void applyAutoStartAndEstimation(Task task) {
        if (task.getAssignedTo() != null && !task.getAssignedTo().trim().isEmpty()) {
            LocalDateTime now = LocalDateTime.now();

            if (task.getAssignedAt() == null) {
                task.setAssignedAt(now);
            }

            if (task.getDueDate() != null) {
                if (task.getStartedAt() == null) {
                    task.setStartedAt(now);
                }

                if (task.getStatus() == TaskStatus.TODO) {
                    task.setStatus(TaskStatus.IN_PROGRESS);
                }

                LocalDateTime startTime = task.getStartedAt() != null ? task.getStartedAt() : now;

                if (task.getDueDate().isAfter(startTime)) {
                    long hoursDifference = Duration.between(startTime, task.getDueDate()).toHours();
                    int newEstimated = (int) Math.max(0, hoursDifference);

                    // ✅ FIX 1: LUÔN cập nhật estimatedHours khi DueDate thay đổi
                    task.setEstimatedHours(newEstimated);

                    // ✅ FIX 2: Cập nhật originalEstimatedHours CHỈ KHI nó NULL hoặc 0
                    if (task.getOriginalEstimatedHours() == null || task.getOriginalEstimatedHours() == 0) {
                        task.setOriginalEstimatedHours(newEstimated);
                    }

                    // ✅ FIX 3: Cập nhật originalDueDate CHỈ KHI nó NULL hoặc bị lỗi 00:00
                    if (task.getOriginalDueDate() == null) {
                        task.setOriginalDueDate(task.getDueDate());
                    } else if (task.getOriginalDueDate().getHour() == 0 &&
                            task.getOriginalDueDate().getMinute() == 0) {
                        // Fix lỗi originalDueDate bị 00:00
                        task.setOriginalDueDate(task.getDueDate());
                    }

                    log.info("✅ Recalculated task {}: EstimatedHours={}, OriginalEstimatedHours={}, DueDate={}, OriginalDueDate={}",
                            task.getTitle(),
                            task.getEstimatedHours(),
                            task.getOriginalEstimatedHours(),
                            task.getDueDate(),
                            task.getOriginalDueDate());
                } else {
                    task.setEstimatedHours(0);
                }
            }
        }
    }


    @Transactional
    public TaskResponse createTask(TaskCreationRequest request) {
        String creatorId = getCurrentUserId();
        log.info("Creating task for user {}", creatorId);
        // Create the main task
        Task task = taskMapper.toTask(request);
        task.setCreatedBy(creatorId);

        // Clean up empty assigneeId - convert empty string to null
        String assigneeId = request.getAssigneeId();
        if (assigneeId != null && assigneeId.trim().isEmpty()) {
            assigneeId = null;
            log.info("Converting empty assigneeId to null for task: {}", request.getTitle());
        }
        task.setAssignedTo(assigneeId);

        task.setReporterId(request.getReporterId());

        applyAutoStartAndEstimation(task);

        Task savedTask = taskRepository.save(task);
        log.info("Task created with ID: {}", savedTask.getId());

        // **INCREMENT TOTAL TASKS IN PROJECT**
        try {
            projectServiceClient.incrementTotalTasks(savedTask.getProjectId());
            log.info("Incremented totalTasks for project: {}", savedTask.getProjectId());
        } catch (Exception e) {
            log.error("Failed to increment totalTasks for project: {}", savedTask.getProjectId(), e);
        }

        log.info("Task request {}: ", request);
        // Send notification to assigned employee (check for both null and empty string)
        if (savedTask.getAssignedTo() != null && !savedTask.getAssignedTo().trim().isEmpty()) {
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
        } else {
            log.info("Task created without assignee - skipping assignment notifications");
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

        // **ADD TASK TO WORKLOAD SERVICE**
        // Add task to workload if it has an assignee
        if (savedTask.getAssignedTo() != null && !savedTask.getAssignedTo().trim().isEmpty()) {
            try {
                workloadIntegrationService.addTaskToWorkload(savedTask);
                log.info("Added task {} to workload service for user {}", savedTask.getId(), savedTask.getAssignedTo());
            } catch (Exception e) {
                log.error("Failed to add task {} to workload service: {}", savedTask.getId(), e.getMessage());
                // Don't fail task creation if workload service is down
            }
        }



        return enrichTaskResponseWithSkills(savedTask);
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

        LocalDateTime oldDueDate = task.getDueDate(); // Capture old due date

        // Capture old values for workload updates
        Integer oldEstimatedHours = task.getEstimatedHours();
        Integer oldActualHours = task.getActualHours();
        Double oldProgress = task.getProgressPercentage();

        // ✅ UPDATE: Lưu dueDate từ request TRƯỚC KHI gọi applyAutoStartAndEstimation
        if (request.getDueDate() != null) {
            task.setDueDate(request.getDueDate());
        }
        // ✅ APPLIED NEW LOGIC HERE
        // Kiểm tra xem có thay đổi về người được giao HOẶC ngày hết hạn không,
        // hoặc nếu task chưa start mà giờ mới có đủ thông tin
        boolean isAssigneeChanged = !Objects.equals(oldAssigneeId, task.getAssignedTo());
        if (isAssigneeChanged) {
            // [FIX] Nếu đổi người, cập nhật lại thời gian giao việc mới
            task.setAssignedAt(LocalDateTime.now());
        }
        boolean isDueDateChanged = !Objects.equals(oldDueDate, task.getDueDate());
        boolean isNewlyAssigned = oldAssigneeId == null && task.getAssignedTo() != null;
        if (isAssigneeChanged || isDueDateChanged || isNewlyAssigned) {
            applyAutoStartAndEstimation(task);
        }
        taskMapper.updateTask(task, request);

        Task updatedTask = taskRepository.save(task);
        // **UPDATE WORKLOAD SERVICE FOR TASK CHANGES**
        // Update workload if task properties changed (but not reassignment - that's handled separately)
        if (updatedTask.getAssignedTo() != null && updatedTask.getAssignedTo().equals(oldAssigneeId)) {
            try {
                workloadIntegrationService.updateTaskWorkload(updatedTask, oldEstimatedHours, oldActualHours, oldProgress);
                log.info("Updated workload service for task changes: {}", updatedTask.getId());
            } catch (Exception e) {
                log.error("Failed to update workload service for task changes: {}", e.getMessage());
            }
        }

        // Handle task reassignment logic
        if (updatedTask.getAssignedTo() != null &&!updatedTask.getAssignedTo().equals(oldAssigneeId)) {

            String newAssigneeId = updatedTask.getAssignedTo();

            // **UPDATE WORKLOAD SERVICE FOR REASSIGNMENT**
            try {
                workloadIntegrationService.handleTaskReassignment(updatedTask, oldAssigneeId, newAssigneeId);
                log.info("Updated workload service for task reassignment: {} -> {} (task: {})",
                        oldAssigneeId, newAssigneeId, updatedTask.getId());
            } catch (Exception e) {
                log.error("Failed to update workload service for task reassignment: {}", e.getMessage());
            }
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

        return enrichTaskResponseWithSkills(updatedTask);
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

        // Get the basic task response with required skills populated
        TaskResponse taskResponse = enrichTaskResponseWithSkills(task);

        // Fetch required skills for inference
        List<TaskRequiredSkill> requiredSkills = taskRequiredSkillRepository.findByTaskId(taskId);

        // Add AI recommendation metadata
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
                .map(this::enrichTaskResponseWithSkills)
                .toList();
    }

    public List<TaskResponse> getTasksByAssignee(String assigneeId) {
        List<Task> tasks = taskRepository.findByAssignedTo(assigneeId);
        return enrichTasksResponsesWithSkillsBatch(tasks);
    }

    public List<TaskResponse> getTasksByCreator(String creatorId) {
        List<Task> tasks = taskRepository.findByCreatedBy(creatorId);
        return enrichTasksResponsesWithSkillsBatch(tasks);
    }

    public List<TaskResponse> getMyTasks() {

        String currentUserId = getCurrentUserId();
        log.info("Getting my tasks for user: {}", currentUserId);
        
        List<Task> tasks = taskRepository.findByAssignedTo(currentUserId);
        return enrichTasksResponsesWithSkillsBatch(tasks);
    }

    /**
     * Get task hours statistics by project
     * Fetches project members from project-service and calculates hours per member
     */
    public List<TaskHoursStatsResponse> getTaskHoursStatsByProject(String projectId) {
        try {
            log.info("Generating task statistics for project: {}", projectId);

            // 1. Lấy tất cả task của dự án (Kể cả task của người đã nghỉ)
            List<Task> allProjectTasks = taskRepository.findByProjectId(projectId);

            if (allProjectTasks.isEmpty()) {
                log.info("No tasks found for project {}", projectId);
                return Collections.emptyList();
            }

            // 2. Group tasks theo assignedTo (User ID)
            // Chỉ lấy task đã được assign cho ai đó
            Map<String, List<Task>> tasksByUserMap = allProjectTasks.stream()
                    .filter(t -> t.getAssignedTo() != null && !t.getAssignedTo().trim().isEmpty())
                    .collect(Collectors.groupingBy(Task::getAssignedTo));

            log.info("Found tasks assigned to {} distinct users", tasksByUserMap.size());

            // 3. Lấy thông tin thành viên HIỆN TẠI từ project-service (để lấy email, official name)
            Map<String, ProjectServiceClient.ProjectMemberResponse> currentMembersMap = new HashMap<>();
            try {
                ApiResponse<List<ProjectServiceClient.ProjectMemberResponse>> membersResponse =
                        projectServiceClient.getProjectMembers(projectId);

                if (membersResponse.getResult() != null) {
                    currentMembersMap = membersResponse.getResult().stream()
                            .collect(Collectors.toMap(
                                    ProjectServiceClient.ProjectMemberResponse::getUserId,
                                    Function.identity(),
                                    (existing, replacement) -> existing
                            ));
                }
            } catch (Exception e) {
                log.warn("Could not fetch current project members map, proceeding with basic info for all users", e);
            }

            // 4. Tổng hợp dữ liệu (Merge thông tin User + Task Stats)
            List<TaskHoursStatsResponse> finalStats = new ArrayList<>();

            for (Map.Entry<String, List<Task>> entry : tasksByUserMap.entrySet()) {
                String userId = entry.getKey();
                List<Task> userTasks = entry.getValue();

                String userName;
                String email;

                // Kiểm tra xem user này còn trong dự án không
                if (currentMembersMap.containsKey(userId)) {
                    // CASE A: User hiện tại -> Lấy thông tin đầy đủ
                    ProjectServiceClient.ProjectMemberResponse memberInfo = currentMembersMap.get(userId);
                    userName = memberInfo.getUserName();
                    email = memberInfo.getEmail();
                } else {
                    // CASE B: User cũ (đã rời project nhưng có history task) -> Fallback lấy tên
                    userName = getUserFullNameSafely(userId) + " (Former Member)";
                    email = "N/A"; // Hoặc gọi API identityClient để lấy email nếu cần thiết
                }

                // Tính toán chỉ số cho user này
                finalStats.add(calculateTaskStatsForUser(userId, userName, email, userTasks));
            }

            // Optional: Thêm những member hiện tại CHƯA có task nào (để báo cáo đầy đủ nhân sự)
            for (String currentMemberId : currentMembersMap.keySet()) {
                if (!tasksByUserMap.containsKey(currentMemberId)) {
                    ProjectServiceClient.ProjectMemberResponse member = currentMembersMap.get(currentMemberId);
                    finalStats.add(calculateTaskStatsForUser(
                            member.getUserId(),
                            member.getUserName(),
                            member.getEmail(),
                            Collections.emptyList()
                    ));
                }
            }

            return finalStats;

        } catch (Exception e) {
            log.error("Failed to get task hours stats for project: {}", projectId, e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    /**
     * Calculate task hours for a specific member in a project
     */
    private TaskHoursStatsResponse calculateTaskStatsForUser(
            String userId, String userName, String email, List<Task> tasks) {

        if (tasks == null || tasks.isEmpty()) {
            return TaskHoursStatsResponse.builder()
                    .userId(userId)
                    .userName(userName)
                    .email(email)
                    .totalEstimatedHours(0)
                    .totalActualHours(0)
                    .hoursVariance(0)
                    .taskCount(0)
                    .tasks(Collections.emptyList())
                    .build();
        }

        // Calculate totals
        int totalEstimated = tasks.stream()
                .mapToInt(task -> task.getEstimatedHours() != null ? task.getEstimatedHours() : 0)
                .sum();

        int totalActual = tasks.stream()
                .mapToInt(task -> task.getActualHours() != null ? task.getActualHours() : 0)
                .sum();

        // Create task summaries
        List<TaskHoursStatsResponse.TaskSummary> taskSummaries = tasks.stream()
                .map(task -> TaskHoursStatsResponse.TaskSummary.builder()
                        .taskId(task.getId())
                        .title(task.getTitle())
                        .status(task.getStatus() != null ? task.getStatus().name() : "UNKNOWN")
                        .estimatedHours(task.getEstimatedHours())
                        .actualHours(task.getActualHours())
                        .build())
                .collect(Collectors.toList());

        return TaskHoursStatsResponse.builder()
                .userId(userId)
                .userName(userName)
                .email(email)
                .totalEstimatedHours(totalEstimated)
                .totalActualHours(totalActual)
                .hoursVariance(totalActual - totalEstimated)
                .taskCount(tasks.size())
                .tasks(taskSummaries)
                .build();
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
                    .map(this::enrichTaskResponseWithSkills)
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

        // ⚡ Use batch enrichment to prevent N+1 queries
        return enrichTasksResponsesWithSkillsBatch(tasks);
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
            // FIX: Set completedAt when status changes to DONE
            // This is critical for performance calculation
            if (task.getCompletedAt() == null) {
                task.setCompletedAt(LocalDateTime.now());
            }
            // Note: progressPercentage is preserved as employee's self-assessment
        }

        if (request.getComments() != null) {
            task.setComments(request.getComments());
        }

        Task updatedTask = taskRepository.save(task);
        log.info("Task status updated: {} -> {} for task ID: {}", oldStatus, request.getStatus(), taskId);

        // Update workload service for status change
        try {
            workloadIntegrationService.updateTaskStatusInWorkload(updatedTask, oldStatus, request.getStatus());

            // Remove task from workload if completed or cancelled
            if (request.getStatus() == TaskStatus.DONE || request.getStatus() == TaskStatus.CANCELLED) {
                workloadIntegrationService.removeTaskFromWorkload(updatedTask);
                log.info("Removed completed/cancelled task {} from workload service", taskId);
            }
        } catch (Exception e) {
            log.error("Failed to update workload service for status change: {}", e.getMessage());
        }

        return enrichTaskResponseWithSkills(updatedTask);
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

    /**
     * Enrich TaskResponse with required skills from TaskRequiredSkill table
     */
    private TaskResponse enrichTaskResponseWithSkills(Task task) {
        TaskResponse response = taskMapper.toTaskResponse(task);

        // Fetch and populate required skills
        List<TaskRequiredSkill> skills = taskRequiredSkillRepository.findByTaskId(task.getId());
        List<String> requiredSkills = skills.stream()
                .map(TaskRequiredSkill::getSkillName)
                .toList();

        log.info("Required skills for task {}: {}", task.getId(), requiredSkills);
        response.setRequiredSkills(requiredSkills);

        // ✅ ADD: Populate AI recommendation metadata
        response.setTaskType(inferTaskType(task));
        response.setDepartment(inferDepartment(task, skills));
        response.setDifficulty(inferDifficulty(task, skills));

        return response;
    }

    /**
     * ⚡ PERFORMANCE OPTIMIZATION: Batch enrich tasks with skills
     * Prevents N+1 query problem by fetching all skills in one query
     */
    private List<TaskResponse> enrichTasksResponsesWithSkillsBatch(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return Collections.emptyList();
        }

        // Extract all task IDs
        List<String> taskIds = tasks.stream()
                .map(Task::getId)
                .toList();

        // 🚀 BATCH FETCH: Get all skills for all tasks in ONE query
        Map<String, List<TaskRequiredSkill>> skillsByTaskId = 
                taskRequiredSkillRepository.findByTaskIdInGrouped(taskIds);

        log.info("⚡ Batch fetched skills for {} tasks", taskIds.size());

        // Enrich each task with its skills
        return tasks.stream()
                .map(task -> {
                    TaskResponse response = taskMapper.toTaskResponse(task);

                    // Get skills for this task from the batch-fetched map
                    List<TaskRequiredSkill> skills = skillsByTaskId.getOrDefault(task.getId(), Collections.emptyList());
                    List<String> requiredSkills = skills.stream()
                            .map(TaskRequiredSkill::getSkillName)
                            .toList();

                    response.setRequiredSkills(requiredSkills);

                    // Populate AI recommendation metadata
                    response.setTaskType(inferTaskType(task));
                    response.setDepartment(inferDepartment(task, skills));
                    response.setDifficulty(inferDifficulty(task, skills));

                    return response;
                })
                .toList();
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

        // Convert skills to skill names for requiredSkills field
        List<String> skillNames = skills.stream()
                .map(TaskRequiredSkill::getSkillName)
                .toList();

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
                .startedAt(task.getStartedAt())
                .completedAt(task.getCompletedAt())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .dependencies(dependencyResponses.toArray(new TaskDependencyResponse[0]))
                .requiredSkills(skillNames)
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
                    String projectName = getProjectByIdNoToken(task.getProjectId());

                    log.info("Project name:{}",projectName );

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

    private String getProjectByIdNoToken(String projectId) {
        try {
            if (projectId == null || projectId.trim().isEmpty()) {
                log.warn("Project ID is null or empty");
                return "Unknown Project";
            }

            log.debug("Fetching project details for ID: {}", projectId);
            // Call project service to get project details
            ApiResponse<ProjectResponse> response =
                    projectServiceClient.getProjectByIdNoToken(projectId);

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
    private String getProjectNameById(String projectId) {
        try {
            if (projectId == null || projectId.trim().isEmpty()) {
                log.warn("Project ID is null or empty");
                return "Unknown Project";
            }

            log.debug("Fetching project details for ID: {}", projectId);
            // Call project service to get project details
            ApiResponse<ProjectResponse> response =
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

        // **UPDATE WORKLOAD SERVICE FOR PROGRESS UPDATE**
        try {
            workloadIntegrationService.updateTaskWorkload(updatedTask, null, null, null);

            // Remove task from workload if completed (100% progress)
            if (request.getProgressPercentage() == 100) {
                workloadIntegrationService.removeTaskFromWorkload(updatedTask);
                log.info("Removed completed task {} from workload service", taskId);
            }
        } catch (Exception e) {
            log.error("Failed to update workload service for progress update: {}", e.getMessage());
        }

        return enrichTaskResponseWithSkills(updatedTask);
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

    /**
     * Send deadline reminder notifications for tasks due in 3 days, 1 day, or overdue
     * Called by scheduled job
     */
    public void sendDeadlineReminders() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Check if within working hours (already scheduled at 9am on weekdays, but double-check)
            if (!isWorkingHours(now)) {
                log.info("Not within working hours, skipping deadline reminders");
                return;
            }
            
            // 3 days before reminders - check tasks due in roughly 3 days (with 12-hour window)
            LocalDateTime threeDaysStart = now.plusDays(3).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime threeDaysEnd = now.plusDays(3).withHour(23).withMinute(59).withSecond(59);
            List<Task> tasksIn3Days = taskRepository.findTasksDueInRange(threeDaysStart, threeDaysEnd);
            
            for (Task task : tasksIn3Days) {
                sendDeadlineReminderNotification(task, 3);
            }
            log.info("Sent {} deadline reminders for tasks due in 3 days", tasksIn3Days.size());
            
            // 1 day before reminders - check tasks due in roughly 1 day (with 12-hour window)
            LocalDateTime oneDayStart = now.plusDays(1).withHour(0).withMinute(0).withSecond(0);
            LocalDateTime oneDayEnd = now.plusDays(1).withHour(23).withMinute(59).withSecond(59);
            List<Task> tasksIn1Day = taskRepository.findTasksDueInRange(oneDayStart, oneDayEnd);
            
            for (Task task : tasksIn1Day) {
                sendDeadlineReminderNotification(task, 1);
            }
            log.info("Sent {} deadline reminders for tasks due in 1 day", tasksIn1Day.size());
            
            // Deadline day reminders - check tasks due today
            LocalDateTime todayStart = now.withHour(0).withMinute(0).withSecond(0);
            LocalDateTime todayEnd = now.withHour(23).withMinute(59).withSecond(59);
            List<Task> tasksToday = taskRepository.findTasksDueInRange(todayStart, todayEnd);
            
            for (Task task : tasksToday) {
                // Only send if not already past due
                if (!task.getDueDate().isBefore(now)) {
                    sendDeadlineReminderNotification(task, 0); // 0 means deadline day
                }
            }
            log.info("Sent {} deadline reminders for tasks due today", tasksToday.size());
            
        } catch (Exception e) {
            log.error("Failed to send deadline reminder notifications", e);
        }
    }

    /**
     * Send overdue reminders - separate method for 2x daily execution
     */
    public void sendOverdueReminders() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Check if within working hours
            if (!isWorkingHours(now)) {
                log.info("Not within working hours, skipping overdue reminders");
                return;
            }
            
            // Find all overdue tasks
            List<Task> overdueTasks = taskRepository.findOverdueActiveTasks(now);
            
            for (Task task : overdueTasks) {
                sendDeadlineReminderNotification(task, -1); // -1 means overdue
            }
            log.info("Sent {} overdue task reminders", overdueTasks.size());
            
        } catch (Exception e) {
            log.error("Failed to send overdue reminder notifications", e);
        }
    }

    /**
     * Check if current time is within working hours
     * Working hours: Monday-Friday, before 6:00 PM
     */
    private boolean isWorkingHours(LocalDateTime dateTime) {
        DayOfWeek dayOfWeek = dateTime.getDayOfWeek();
        int hour = dateTime.getHour();
        
        // Check if weekday (Monday to Friday)
        boolean isWeekday = dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY;
        
        // Check if before 6 PM (18:00)
        boolean isBeforeSixPM = hour < 18;
        
        return isWeekday && isBeforeSixPM;
    }

    /**
     * Send individual deadline reminder notification
     * @param task The task to send reminder for
     * @param daysUntilDue 3 = 3 days before, 1 = 1 day before, 0 = deadline day, -1 = overdue
     */
    private void sendDeadlineReminderNotification(Task task, int daysUntilDue) {
        try {
            if (task.getAssignedTo() == null) {
                return;
            }

            String dueDate = task.getDueDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String projectName = getProjectByIdNoToken(task.getProjectId());
            log.info("Project name for deadline reminder:{}",projectName );
            String reminderType;
            if (daysUntilDue == 3) {
                reminderType = "3_DAYS";
            } else if (daysUntilDue == 1) {
                reminderType = "1_DAY";
            } else if (daysUntilDue == 0) {
                reminderType = "DEADLINE_DAY";
            } else {
                reminderType = "OVERDUE";
            }

            RealTimeNotificationClient.DeadlineReminderNotificationRequest request =
                    new RealTimeNotificationClient.DeadlineReminderNotificationRequest(
                            task.getAssignedTo(),
                            task.getId(),
                            task.getTitle(),
                            projectName,
                            dueDate,
                            reminderType
                    );

            realTimeNotificationClient.sendDeadlineReminderNotification(request);
            log.info("Sent {} deadline reminder for task: {}", reminderType, task.getTitle());
        } catch (Exception e) {
            log.error("Failed to send deadline reminder notification for task: {}", task.getTitle(), e);
        }
    }
}
