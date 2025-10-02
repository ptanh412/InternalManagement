package com.mnp.project.service;

import com.mnp.project.client.ChatServiceClient;
import com.mnp.project.client.TaskServiceClient;
import com.mnp.project.dto.response.*;
import com.mnp.project.dto.request.CreateProjectRequest;
import com.mnp.project.dto.request.CreateProjectGroupRequest;
import com.mnp.project.dto.request.UpdateProjectRequest;
import com.mnp.project.entity.Project;
import com.mnp.project.enums.ProjectStatus;
import com.mnp.project.exception.AppException;
import com.mnp.project.exception.ErrorCode;
import com.mnp.project.repository.ProjectRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll()
                .stream()
                .map(this::mapToProjectResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));
        return mapToProjectResponse(project);
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

        return mapToProjectResponse(savedProject);
    }

    public ProjectResponse updateProject(String id, UpdateProjectRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getProjectLeaderId() != null) project.setProjectLeaderId(request.getProjectLeaderId());
        if (request.getTeamLeadId() != null) project.setTeamLeadId(request.getTeamLeadId()); // Update team lead
        if (request.getStatus() != null) project.setStatus(request.getStatus());
        if (request.getPriority() != null) project.setPriority(request.getPriority());
        if (request.getBudget() != null) project.setBudget(request.getBudget());
        if (request.getActualCost() != null) project.setActualCost(request.getActualCost());
        if (request.getStartDate() != null) project.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) project.setEndDate(request.getEndDate());
        if (request.getActualStartDate() != null) project.setActualStartDate(request.getActualStartDate());
        if (request.getActualEndDate() != null) project.setActualEndDate(request.getActualEndDate());

        project.setUpdatedAt(LocalDateTime.now());

        Project updatedProject = projectRepository.save(project);
        return mapToProjectResponse(updatedProject);
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
        return mapToProjectResponse(updatedProject);
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
                .isOnTrack(isProjectOnTrack(project))
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
                .map(this::mapToProjectResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByLeader(String leaderId) {
        return projectRepository.findByProjectLeaderId(leaderId)
                .stream()
                .map(this::mapToProjectResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> getProjectsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return projectRepository.findByDateRange(startDate, endDate)
                .stream()
                .map(this::mapToProjectResponse)
                .collect(Collectors.toList());
    }

    public List<ProjectResponse> searchProjects(String keyword) {
        return projectRepository.searchProjects(keyword)
                .stream()
                .map(this::mapToProjectResponse)
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
                .build();
    }

    public List<ProjectSummaryResponse> getProjectSummaries() {
        return projectRepository.findAll()
                .stream()
                .map(this::mapToProjectSummaryResponse)
                .collect(Collectors.toList());
    }

    // Helper methods
    private ProjectResponse mapToProjectResponse(Project project) {
        // Fetch tasks from task-service
        List<TaskDto> tasks = fetchProjectTasks(project.getId());

        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .projectLeaderId(project.getProjectLeaderId())
                .teamLeadId(project.getTeamLeadId()) // Include team lead in response
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
                .requiredSkills(project.getRequiredSkills())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .tasks(tasks) // Include tasks in the response
                .build();
    }

    private List<TaskDto> fetchProjectTasks(String projectId) {
        try {
            log.info("Fetching tasks for project: {}", projectId);
            return taskServiceClient.getTasksByProjectId(projectId);
        } catch (Exception e) {
            log.error("Failed to fetch tasks for project {}: {}", projectId, e.getMessage());
            return Collections.emptyList(); // Return empty list if task-service is unavailable
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
    public void updateProjectSkills(String projectId, List<String> skillsToAdd) {
        if (skillsToAdd == null || skillsToAdd.isEmpty()) {
            return;
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_EXISTED));

        List<String> currentSkills = project.getRequiredSkills();
        if (currentSkills == null) {
            currentSkills = new ArrayList<>();
        }

        // Add new skills that are not already in the list
        for (String skill : skillsToAdd) {
            if (!currentSkills.contains(skill)) {
                currentSkills.add(skill);
            }
        }

        project.setRequiredSkills(currentSkills);
        project.setUpdatedAt(LocalDateTime.now());
        projectRepository.save(project);

        log.info("Updated required skills for project {}: added skills = {}", projectId, skillsToAdd);
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
}
