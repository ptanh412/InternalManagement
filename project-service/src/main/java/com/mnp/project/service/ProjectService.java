package com.mnp.project.service;

import com.mnp.project.client.ChatServiceClient;
import com.mnp.project.client.IdentityServiceClient;
import com.mnp.project.client.NotificationServiceClient;
import com.mnp.project.client.TaskServiceClient;
import com.mnp.project.dto.response.*;
import com.mnp.project.dto.request.AddProjectMemberRequest;
import com.mnp.project.dto.request.CreateProjectRequest;
import com.mnp.project.dto.request.CreateProjectGroupRequest;
import com.mnp.project.dto.request.UpdateProjectRequest;
import com.mnp.project.entity.Project;
import com.mnp.project.enums.ProjectRole;
import com.mnp.project.enums.ProjectStatus;
import com.mnp.project.exception.AppException;
import com.mnp.project.exception.ErrorCode;
import com.mnp.project.repository.ProjectRepository;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectService {

    ProjectRepository projectRepository;
    TaskServiceClient taskServiceClient;
    ChatServiceClient chatServiceClient;
    IdentityServiceClient identityServiceClient;
    NotificationServiceClient notificationServiceClient;
    ProjectMemberService projectMemberService;
    SocketIOService socketIOService; // Add Socket.IO service

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll()
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list view
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));
        return mapToProjectResponseWithTasks(project); // ✅ Fetch tasks only for detail view
    }

    public ProjectResponse createProject(CreateProjectRequest request) {
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .projectLeaderId(request.getProjectLeaderId())
                .teamLeadId(request.getTeamLeadId()) // Set team lead from request
                .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNING)
                .priority(request.getPriority())
                .budget(request.getBudget())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalTasks(0)  // Explicitly set to prevent null
                .completedTasks(0)  // Explicitly set to prevent null
                .completionPercentage(0.0)  // Explicitly set to prevent null
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Project savedProject = projectRepository.save(project);

        // Automatically add team lead as project member
        if (savedProject.getTeamLeadId() != null) {
            try {
                log.info("Adding team lead as project member: {}", savedProject.getTeamLeadId());

                AddProjectMemberRequest memberRequest = AddProjectMemberRequest.builder()
                        .projectId(savedProject.getId())
                        .userId(savedProject.getTeamLeadId())
                        .role(ProjectRole.TEAM_LEAD)
                        .build();

                projectMemberService.addMemberToProject(memberRequest);
                log.info("Successfully added team lead as project member: {}", savedProject.getTeamLeadId());
            } catch (Exception e) {
                log.error("Failed to add team lead as project member {}: {}", savedProject.getTeamLeadId(), e.getMessage());
            }
        }

        // Note: Team lead notification is handled by ProjectMemberService when adding members
        // No duplicate notification needed here

        // Automatically create chat group for the project
        try {
            log.info("Creating chat group for project: {}", savedProject.getId());

            // Prepare initial members list with both project leader and team lead (if different)
            List<String> initialMembers = new ArrayList<>();
            initialMembers.add(savedProject.getProjectLeaderId());

            // Add team lead if it's different from project leader
            if (savedProject.getTeamLeadId() != null &&
                !savedProject.getTeamLeadId().equals(savedProject.getProjectLeaderId())) {
                initialMembers.add(savedProject.getTeamLeadId());
            }

            CreateProjectGroupRequest chatGroupRequest = CreateProjectGroupRequest.builder()
                    .projectId(savedProject.getId())
                    .projectName(savedProject.getName())
                    .projectManagerId(savedProject.getProjectLeaderId())
                    .teamLeadId(savedProject.getTeamLeadId()) // Use actual team lead from project
                    .initialMemberIds(initialMembers) // Include both project leader and team lead
                    .groupName(savedProject.getName() + " Team Chat")
                    .build();

            chatServiceClient.createProjectGroup(chatGroupRequest);
            log.info("Chat group created successfully for project: {}", savedProject.getId());
        } catch (Exception e) {
            log.error("Failed to create chat group for project {}: {}", savedProject.getId(), e.getMessage());
            // Don't fail project creation if chat group creation fails
        }

        ProjectResponse projectResponse = mapToProjectResponseSimple(savedProject); // ✅ No need tasks after creation

        // Send real-time notification to team leads via Socket.IO
        try {
            socketIOService.notifyProjectCreated(projectResponse);
            log.info("Real-time notification sent for new project: {}", savedProject.getName());
        } catch (Exception e) {
            log.error("Failed to send real-time notification for project {}: {}", savedProject.getId(), e.getMessage());
            // Don't fail project creation if notification fails
        }

        return projectResponse;
    }

    // Cập nhật hàm isValueChanged
    private boolean isValueChanged(Object oldValue, Object newValue) {
        if (newValue == null) return false;
        if (oldValue == null) return true;

        // 1. Xử lý BigDecimal (cho Budget)
        if (newValue instanceof BigDecimal && oldValue instanceof BigDecimal) {
            return ((BigDecimal) newValue).compareTo((BigDecimal) oldValue) != 0;
        }

        // 2. Xử lý Date/Time (LocalDateTime): Chuyển về String để so sánh tuyệt đối an toàn
        if (newValue instanceof LocalDateTime && oldValue instanceof LocalDateTime) {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
            String newStr = ((LocalDateTime) newValue).format(formatter);
            String oldStr = ((LocalDateTime) oldValue).format(formatter);
            return !newStr.equals(oldStr);
        }

        // Nếu kiểu dữ liệu bị lệch (VD: Timestamp vs LocalDateTime), so sánh String sẽ giải quyết được
        if (newValue instanceof LocalDateTime || oldValue instanceof LocalDateTime) {
            String newStr = newValue.toString().substring(0, Math.min(newValue.toString().length(), 16)); // Lấy đến phút
            String oldStr = oldValue.toString().substring(0, Math.min(oldValue.toString().length(), 16));
            return !newStr.equals(oldStr);
        }

        // 3. So sánh thông thường
        return !newValue.equals(oldValue);
    }

    public ProjectResponse updateProject(String id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        // Track what fields are being updated
        List<String> updatedFields = new ArrayList<>();

        log.info("Updating project {}: {}", id, request.toString());

        // --- CHECK STRING FIELDS ---
        if (isValueChanged(project.getName(), request.getName())) {
            project.setName(request.getName());
            updatedFields.add("Project name");
        }

        if (isValueChanged(project.getDescription(), request.getDescription())) {
            project.setDescription(request.getDescription());
            updatedFields.add("Description");
        }

        // --- CHECK ID FIELDS ---
        if (isValueChanged(project.getProjectLeaderId(), request.getProjectLeaderId())) {
            project.setProjectLeaderId(request.getProjectLeaderId());
            updatedFields.add("Project leader");
        }

        if (isValueChanged(project.getTeamLeadId(), request.getTeamLeadId())) {
            project.setTeamLeadId(request.getTeamLeadId());
            updatedFields.add("Team lead");
        }

        // --- CHECK ENUM/NUMERIC FIELDS ---
        if (isValueChanged(project.getStatus(), request.getStatus())) {
            project.setStatus(request.getStatus());
            updatedFields.add("Status to " + request.getStatus());
        }

        if (isValueChanged(project.getPriority(), request.getPriority())) {
            project.setPriority(request.getPriority());
            updatedFields.add("Priority to " + request.getPriority());
        }

        if (isValueChanged(project.getBudget(), request.getBudget())) {
            project.setBudget(request.getBudget());
            updatedFields.add("Budget");
        }

        if (isValueChanged(project.getActualCost(), request.getActualCost())) {
            project.setActualCost(request.getActualCost());
            updatedFields.add("Actual cost");
        }

        // --- CHECK DATE FIELDS (Sẽ sử dụng logic bỏ qua giây trong hàm isValueChanged) ---
        if (isValueChanged(project.getStartDate(), request.getStartDate())) {
            project.setStartDate(request.getStartDate());
            updatedFields.add("Start date");
        }

        if (isValueChanged(project.getEndDate(), request.getEndDate())) {
            project.setEndDate(request.getEndDate());
            updatedFields.add("End date");
        }

        if (isValueChanged(project.getActualStartDate(), request.getActualStartDate())) {
            project.setActualStartDate(request.getActualStartDate());
            updatedFields.add("Actual start date");
        }

        if (isValueChanged(project.getActualEndDate(), request.getActualEndDate())) {
            project.setActualEndDate(request.getActualEndDate());
            updatedFields.add("Actual end date");
        }

        // Chỉ save và gửi noti nếu thực sự có trường thay đổi
        if (!updatedFields.isEmpty()) {
            project.setUpdatedAt(LocalDateTime.now());
            Project updatedProject = projectRepository.save(project);
            sendProjectUpdateNotification(updatedProject, updatedFields);
            return mapToProjectResponseSimple(updatedProject); // ✅ No need tasks after update
        } else {
            log.info("No fields changed for project {}", id);
            // Trả về project hiện tại mà không update DB hay gửi noti
            return mapToProjectResponseSimple(project); // ✅ No need tasks
        }
    }

    public void deleteProject(String id) {
        if (!projectRepository.existsById(id)) {
            throw new AppException(ErrorCode.PROJECT_NOT_EXISTED);
        }
        projectRepository.deleteById(id);
    }

    public ProjectResponse updateProjectStatus(String id, ProjectStatus status) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        project.setStatus(status);


        project.setUpdatedAt(LocalDateTime.now());

        // Set actual dates based on status
        if (status == ProjectStatus.ACTIVE && project.getActualStartDate() == null) {
            project.setActualStartDate(LocalDateTime.now());
        } else if (status == ProjectStatus.COMPLETED && project.getActualEndDate() == null) {
            project.setActualEndDate(LocalDateTime.now());
            project.setCompletionPercentage(100.0);
        }

        Project updatedProject = projectRepository.save(project);
        return mapToProjectResponseSimple(updatedProject); // ✅ No need tasks after status update
    }

    public ProjectProgressResponse getProjectProgress(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        return ProjectProgressResponse.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .completionPercentage(project.getCompletionPercentage())
                .totalTasks(project.getTotalTasks())
                .completedTasks(project.getCompletedTasks())
                .pendingTasks(project.getTotalTasks() - project.getCompletedTasks())
                .lastUpdated(project.getUpdatedAt())
                .isOnSchedule(isProjectOnTrack(project))
                .daysRemaining(calculateDaysRemaining(project))
                .build();
    }

    public Double calculateProjectProgress(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        if (project.getTotalTasks() == 0) return 0.0;

        double progress = (double) project.getCompletedTasks() / project.getTotalTasks() * 100;

        // Update the project with calculated progress
        project.setCompletionPercentage(progress);
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        return progress;
    }

    public List<ProjectResponse> getProjectsByStatus(ProjectStatus status) {
        return projectRepository.findByStatus(status)
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByLeader(String leaderId) {
        return projectRepository.findByProjectLeaderId(leaderId)
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return projectRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> searchProjects(String keyword) {
        return projectRepository.searchProjects(keyword)
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list
                .collect(Collectors.toList());
    }

    public ProjectAnalyticsResponse getProjectAnalytics() {
        List<Project> allProjects = projectRepository.findAll();

        Map<ProjectStatus, Long> statusCounts = allProjects.stream()
                .collect(Collectors.groupingBy(Project::getStatus, Collectors.counting()));

        BigDecimal totalBudget = allProjects.stream()
                .map(Project::getBudget)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalActualCost = allProjects.stream()
                .map(Project::getActualCost)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double averageCompletion = allProjects.stream()
                .mapToDouble(Project::getCompletionPercentage)
                .average()
                .orElse(0.0);

        Map<String, Integer> projectsByStatus = statusCounts.entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> entry.getKey().name(),
                        entry -> entry.getValue().intValue()
                ));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM");
        Map<String, Integer> projectsCreatedByMonth = allProjects.stream()
                .filter(p -> p.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCreatedAt().format(formatter),
                        Collectors.reducing(0, e -> 1, Integer::sum)
                ));

        Map<String, Integer> sortedProjectsByMonth = new TreeMap<>(projectsCreatedByMonth);
        return ProjectAnalyticsResponse.builder()
                .totalProjects(allProjects.size())
                .activeProjects(statusCounts.getOrDefault(ProjectStatus.ACTIVE, 0L).intValue())
                .completedProjects(statusCounts.getOrDefault(ProjectStatus.COMPLETED, 0L).intValue())
                .onHoldProjects(statusCounts.getOrDefault(ProjectStatus.ON_HOLD, 0L).intValue())
                .cancelledProjects(statusCounts.getOrDefault(ProjectStatus.CANCELLED, 0L).intValue())
                .totalBudget(totalBudget)
                .totalActualCost(totalActualCost)
                .budgetVariance(totalBudget.subtract(totalActualCost))
                .averageCompletionPercentage(averageCompletion)
                .projectsByStatus(projectsByStatus)
                .projectsCreatedByMonth(sortedProjectsByMonth)
                .build();
    }

    public List<ProjectSummaryResponse> getProjectSummaries() {
        return projectRepository.findAll()
                .stream()
                .map(this::mapToProjectSummaryResponse)
                .collect(Collectors.toList());
    }

    // Helper methods
    
    /**
     * ✅ Map project to response WITHOUT fetching tasks (for list views)
     * Use this for getAllProjects, getProjectsByStatus, etc. to avoid N+1 problem
     */
    private ProjectResponse mapToProjectResponseSimple(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .projectLeaderId(project.getProjectLeaderId())
                .teamLeadId(project.getTeamLeadId())
                .status(project.getStatus())
                .priority(project.getPriority())
                .budget(project.getBudget())
                .actualCost(project.getActualCost())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .actualStartDate(project.getActualStartDate())
                .actualEndDate(project.getActualEndDate())
                .totalTasks(project.getTotalTasks())
                .completedTasks(project.getCompletedTasks())
                .completionPercentage(project.getCompletionPercentage())
                .requiredSkills(null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .tasks(Collections.emptyList()) // ✅ Empty list instead of fetching
                .build();
    }
    
    /**
     * ✅ Map project to response WITH tasks (for detail view)
     * Use this only for getProjectById or when tasks are explicitly needed
     */
    private ProjectResponse mapToProjectResponseWithTasks(Project project) {
        // Fetch tasks from task-service
        List<TaskDto> tasks = fetchProjectTasks(project.getId());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .projectLeaderId(project.getProjectLeaderId())
                .teamLeadId(project.getTeamLeadId())
                .status(project.getStatus())
                .priority(project.getPriority())
                .budget(project.getBudget())
                .actualCost(project.getActualCost())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .actualStartDate(project.getActualStartDate())
                .actualEndDate(project.getActualEndDate())
                .totalTasks(project.getTotalTasks())
                .completedTasks(project.getCompletedTasks())
                .completionPercentage(project.getCompletionPercentage())
                .requiredSkills(null)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .tasks(tasks) // ✅ Include tasks in the response
                .build();
    }

    private List<TaskDto> fetchProjectTasks(String projectId) {
        try {
            log.info("Fetching tasks for project: {}", projectId);
            List<TaskDto> tasks = taskServiceClient.getTasksByProjectId(projectId);

            // Log kiểm tra dữ liệu nhận được (chỉ bật khi debug)
            // log.info("Received {} tasks for project {}", tasks.size(), projectId);

            return tasks;
        } catch (FeignException e) {
            log.error("Feign error fetching tasks for project {}: status={} body={}",
                    projectId, e.status(), e.contentUTF8(), e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unknown error fetching tasks for project {}: {}", projectId, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    private ProjectSummaryResponse mapToProjectSummaryResponse(Project project) {
        return ProjectSummaryResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .projectLeaderId(project.getProjectLeaderId())
                .status(project.getStatus())
                .priority(project.getPriority())
                .budget(project.getBudget())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .completionPercentage(project.getCompletionPercentage())
                .totalTasks(project.getTotalTasks())
                .completedTasks(project.getCompletedTasks())
                .build();
    }

    private Boolean isProjectOnTrack(Project project) {
        if (project.getEndDate() == null) return true;

        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(project.getEndDate()) && project.getStatus() != ProjectStatus.COMPLETED) {
            return false;
        }

        // Calculate expected progress based on time elapsed
        long totalDays = ChronoUnit.DAYS.between(project.getStartDate(), project.getEndDate());
        long elapsedDays = ChronoUnit.DAYS.between(project.getStartDate(), now);

        if (totalDays <= 0) return true;

        double expectedProgress = (double) elapsedDays / totalDays * 100;
        return project.getCompletionPercentage() >= expectedProgress * 0.9; // 10% tolerance
    }

    private Integer calculateDaysRemaining(Project project) {
        if (project.getEndDate() == null) return null;

        LocalDateTime now = LocalDateTime.now();
        long daysRemaining = ChronoUnit.DAYS.between(now, project.getEndDate());

        return Math.max(0, (int) daysRemaining);
    }

    // Methods for task-service integration
    @Transactional
    public void incrementTotalTasks(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        // Handle null totalTasks by initializing to 0 if null
        Integer currentTotalTasks = project.getTotalTasks();
        if (currentTotalTasks == null) {
            currentTotalTasks = 0;
        }

        project.setTotalTasks(currentTotalTasks + 1);
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        log.info("Incremented total tasks for project {}: new count = {}", projectId, project.getTotalTasks());
    }


    @Transactional
    public void decrementTotalTasks(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        // Handle null totalTasks by initializing to 0 if null
        Integer currentTotalTasks = project.getTotalTasks();
        if (currentTotalTasks == null) {
            currentTotalTasks = 0;
        }

        if (currentTotalTasks > 0) {
            project.setTotalTasks(currentTotalTasks - 1);
            project.setUpdatedAt(LocalDateTime.now());
            projectRepository.save(project);

            log.info("Decremented total tasks for project {}: new count = {}", projectId, project.getTotalTasks());
        }
    }

    @Transactional
    public void incrementCompletedTasks(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        // Handle null completedTasks by initializing to 0 if null
        Integer currentCompletedTasks = project.getCompletedTasks();
        if (currentCompletedTasks == null) {
            currentCompletedTasks = 0;
        }

        project.setCompletedTasks(currentCompletedTasks + 1);

        // Recalculate completion percentage
        Integer totalTasks = project.getTotalTasks();
        if (totalTasks != null && totalTasks > 0) {
            double newPercentage = (double) project.getCompletedTasks() / totalTasks * 100;
            project.setCompletionPercentage(newPercentage);
        }

        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        log.info("Incremented completed tasks for project {}: new count = {}, completion = {}%",
                projectId, project.getCompletedTasks(), project.getCompletionPercentage());
    }

    @Transactional
    public void decrementCompletedTasks(String projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        if (project.getCompletedTasks() > 0) {
            project.setCompletedTasks(project.getCompletedTasks() - 1);
            project.setUpdatedAt(LocalDateTime.now());
            projectRepository.save(project);

            log.info("Decremented completedTasks for project {}: {}/{}",
                    projectId, project.getCompletedTasks(), project.getTotalTasks());
        }
    }

    @Transactional
    public void createProjectGroup(String projectId, String groupName) {
        // Logic to create a chat group for the project
        try {
            log.info("Creating chat group for project: {}", projectId);

            // Fetch project details to get complete information
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

            // Prepare initial members list with both project leader and team lead (if different)
            List<String> initialMembers = new ArrayList<>();
            initialMembers.add(project.getProjectLeaderId());

            // Add team lead if it exists and is different from project leader
            if (project.getTeamLeadId() != null &&
                !project.getTeamLeadId().equals(project.getProjectLeaderId())) {
                initialMembers.add(project.getTeamLeadId());
            }

            // Create comprehensive request with project details
            CreateProjectGroupRequest request = CreateProjectGroupRequest.builder()
                    .projectId(projectId)
                    .projectName(project.getName())
                    .projectManagerId(project.getProjectLeaderId())
                    .teamLeadId(project.getTeamLeadId()) // Use actual team lead from project
                    .groupName(groupName != null ? groupName : project.getName() + " Team Chat")
                    .initialMemberIds(initialMembers) // Include both project leader and team lead
                    .build();

            // Call to chat-service to create the group
            chatServiceClient.createProjectGroup(request);
            log.info("Chat group '{}' created successfully for project: {}", request.getGroupName(), projectId);

        } catch (AppException e) {
            log.error("Project not found for chat group creation: {}", projectId);
            throw e;
        } catch (Exception e) {
            log.error("Failed to create chat group for project {}: {}", projectId, e.getMessage(), e);
            throw new AppException(ErrorCode.CHAT_GROUP_CREATION_FAILED);
        }
    }

    public List<ProjectResponse> getProjectsByTeamLead(String teamLeadId) {
        return projectRepository.findByTeamLeadId(teamLeadId)
                .stream()
                .map(this::mapToProjectResponseSimple) // ✅ Don't fetch tasks for list
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsForUser(String userId, String userRole) {
        if ("TEAM_LEAD".equals(userRole)) {
            return getProjectsByTeamLead(userId);
        }else if("PROJECT_MANAGER".equals(userRole)){
            return getProjectsByLeader(userId);
        }else {
            return getAllProjects();
        }
    }

    private String getCurrentUserName() {
        try {
            String userId = SecurityContextHolder.getContext().getAuthentication().getName();
            ApiResponse<UserResponse> response = identityServiceClient.getUser(userId);
            if (response != null && response.getResult() != null) {
                return response.getResult().getFullName();
            }
            return "Unknown User";
        } catch (Exception e) {
            log.error("Failed to fetch current user name for user {}: {}",
                SecurityContextHolder.getContext().getAuthentication().getName(), e.getMessage());
            return "Unknown User";
        }
    }

    /**
     * Send notification to all project members when project is updated
     */
    private void sendProjectUpdateNotification(Project project, List<String> updatedFields) {
        try {
            // Get all project members
            List<String> memberIds = projectMemberService.getProjectMembers(project.getId())
                    .stream()
                    .map(member -> member.getUserId())
                    .collect(Collectors.toList());
            
            if (memberIds.isEmpty()) {
                log.info("No members to notify for project: {}", project.getName());
                return;
            }
            
            // Get current user info
            String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
            String currentUserName = getCurrentUserName();
            
            // Create update details message
            String updateDetails = String.join(", ", updatedFields);
            
            // Create notification request
            NotificationServiceClient.ProjectUpdateNotificationRequest request = 
                    new NotificationServiceClient.ProjectUpdateNotificationRequest(
                            memberIds,
                            project.getId(),
                            project.getName(),
                            currentUserId,
                            currentUserName,
                            updateDetails
                    );
            
            // Send notification
            notificationServiceClient.sendProjectUpdateNotification(request);
            log.info("Project update notification sent to {} members for project: {}", memberIds.size(), project.getName());
            
        } catch (Exception e) {
            log.error("Failed to send project update notification for project: {}", project.getName(), e);
        }
    }

    public boolean teamLeadHasProjects(String teamLeadId, String projectId) {
        return projectRepository.existsByIdAndTeamLeadId(teamLeadId, projectId);
    }



}
