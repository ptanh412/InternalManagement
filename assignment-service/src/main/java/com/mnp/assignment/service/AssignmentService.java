package com.mnp.assignment.service;

import com.mnp.assignment.client.AIServiceClient;
import com.mnp.assignment.client.ChatServiceClient;
import com.mnp.assignment.client.IdentityServiceClient;
import com.mnp.assignment.client.ProfileServiceClient;
import com.mnp.assignment.dto.AssignmentRecommendationDto;
import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.request.CreateAssignmentRequest;
import com.mnp.assignment.dto.request.ReassignTaskRequest;
import com.mnp.assignment.dto.response.AssignmentResponse;
import com.mnp.assignment.dto.response.AssignmentHistoryResponse;
import com.mnp.assignment.entity.TaskAssignment;
import com.mnp.assignment.entity.AssignmentHistory;
import com.mnp.assignment.exception.AppException;
import com.mnp.assignment.exception.ErrorCode;
import com.mnp.assignment.mapper.AssignmentMapper;
import com.mnp.assignment.repository.TaskAssignmentRepository;
import com.mnp.assignment.repository.AssignmentHistoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AssignmentService {

    TaskAssignmentRepository taskAssignmentRepository;
    AssignmentHistoryRepository assignmentHistoryRepository;
    AssignmentMapper assignmentMapper;
    AIServiceClient aiServiceClient;
    IdentityServiceClient identityServiceClient;
    ProfileServiceClient profileServiceClient;
    ChatServiceClient chatServiceClient;
    TaskAssignmentNotificationService taskAssignmentNotificationService;

    public List<AssignmentResponse> getAssignmentsByUserId(String userId) {
        log.info("Getting assignments for user: {}", userId);

        List<TaskAssignment> assignments = taskAssignmentRepository.findByCandidateUserId(userId);

        return assignments.stream()
                .map(assignmentMapper::toAssignmentResponse)
                .toList();
    }

    public List<AssignmentResponse> getAssignmentsByTaskId(String taskId) {
        log.info("Getting assignments for task: {}", taskId);

        List<TaskAssignment> assignments = taskAssignmentRepository.findByTaskId(taskId);

        return assignments.stream()
                .map(assignmentMapper::toAssignmentResponse)
                .toList();
    }

    public AssignmentResponse createAssignment(CreateAssignmentRequest request) {
        log.info("Creating assignment for task: {} to user: {}", request.getTaskId(), request.getCandidateUserId());

        // Check if assignment already exists
        if (taskAssignmentRepository.existsByTaskIdAndCandidateUserId(request.getTaskId(), request.getCandidateUserId())) {
            throw new AppException(ErrorCode.ASSIGNMENT_ALREADY_EXISTS);
        }

        TaskAssignment assignment = assignmentMapper.toTaskAssignment(request);
        assignment.setIsSelected(false); // Default value for manual assignments

        TaskAssignment savedAssignment = taskAssignmentRepository.save(assignment);

        // Add user to project chat group when task is assigned
        // Note: We need the projectId from the task to add to the correct project group
        try {
            // In a real implementation, you would fetch the task details to get projectId
            // For now, assuming projectId is available in the request or can be fetched
            if (request.getProjectId() != null) {
                chatServiceClient.addMemberToProjectGroup(request.getProjectId(), request.getCandidateUserId());
                log.info("User {} added to project {} chat group for assignment {}",
                        request.getCandidateUserId(), request.getProjectId(), savedAssignment.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to add user to project chat group for assignment {}: {}", savedAssignment.getId(), e.getMessage());
            // Don't fail assignment creation if chat group addition fails
        }

        // Notify user about the new assignment
        try {
            taskAssignmentNotificationService.notifyUserAboutNewAssignment(savedAssignment.getId(), request.getCandidateUserId());
            log.info("Notification sent to user {} for new assignment {}", request.getCandidateUserId(), savedAssignment.getId());
        } catch (Exception e) {
            log.warn("Failed to send notification for new assignment {}: {}", savedAssignment.getId(), e.getMessage());
            // Don't fail assignment creation if notification sending fails
        }

        log.info("Assignment created successfully with ID: {}", savedAssignment.getId());

        return assignmentMapper.toAssignmentResponse(savedAssignment);
    }

    public void deleteAssignment(String assignmentId) {
        log.info("Deleting assignment with ID: {}", assignmentId);

        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        taskAssignmentRepository.delete(assignment);

        log.info("Assignment deleted successfully: {}", assignmentId);
    }

    public AssignmentResponse selectAssignment(String assignmentId) {
        log.info("Selecting assignment with ID: {}", assignmentId);

        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        assignment.setIsSelected(true);
        assignment.setAssignedAt(LocalDateTime.now());

        TaskAssignment savedAssignment = taskAssignmentRepository.save(assignment);

        log.info("Assignment selected successfully: {}", assignmentId);

        return assignmentMapper.toAssignmentResponse(savedAssignment);
    }

    public List<AssignmentHistoryResponse> getAssignmentHistoryByTaskId(String taskId) {
        log.info("Getting assignment history for task: {}", taskId);

        List<AssignmentHistory> assignmentHistories = assignmentHistoryRepository.findByTaskIdOrderByReassignedAtDesc(taskId);

        return assignmentHistories.stream()
                .map(assignmentMapper::toAssignmentHistoryResponse)
                .toList();
    }

    @Transactional
    public AssignmentResponse reassignTask(String assignmentId, ReassignTaskRequest request) {
        log.info("Reassigning assignment {} from current assignee to user: {} with reason: {}",
                assignmentId, request.getNewAssigneeId(), request.getReason());

        // Find the current assignment
        TaskAssignment assignment = taskAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new AppException(ErrorCode.ASSIGNMENT_NOT_FOUND));

        String previousAssignee = assignment.getCandidateUserId();

        // Create history record before changing the assignment
        AssignmentHistory history = AssignmentHistory.builder()
                .taskId(assignment.getTaskId())
                .previousAssignee(previousAssignee)
                .newAssignee(request.getNewAssigneeId())
                .reassignedBy(request.getReassignedBy())
                .reason(request.getReason())
                .reasonText(request.getReason() != null ? null : request.getReasonText()) //
                .comments(request.getComments())
                .build();
        // Notify the new assignee about the task reassignment
        try {
            taskAssignmentNotificationService.notifyUserAboutNewAssignment(assignmentId, request.getNewAssigneeId());
            log.info("Reassignment notification sent to user {} for assignment {}", request.getNewAssigneeId(), assignmentId);
        } catch (Exception e) {
            log.warn("Failed to send reassignment notification for assignment {}: {}", assignmentId, e.getMessage());
            // Don't fail reassignment if notification sending fails
        }

        assignment.setCandidateUserId(request.getNewAssigneeId());
        assignment.setIsSelected(false); // Reset selection for reassigned tasks

        taskAssignmentRepository.save(assignment);
        assignmentHistoryRepository.save(history);

        log.info("Assignment {} reassigned to user: {}", assignmentId, request.getNewAssigneeId());

        return assignmentMapper.toAssignmentResponse(assignment);
    }

    /**
     * Generate AI-powered task assignment recommendations using the dedicated ai-service
     */
    public List<AssignmentRecommendationDto> generateTaskRecommendations(String taskId) {
        log.info("Generating AI recommendations for task: {} using ai-service", taskId);

        try {
            ApiResponse<List<AssignmentRecommendationDto>> response =
                aiServiceClient.generateTaskRecommendations(taskId);

            return response.getResult();
        } catch (Exception e) {
            log.error("Error generating AI recommendations for task: {}", taskId, e);
            throw new AppException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    /**
     * Generate emergency recommendations for urgent tasks
     */
    public List<AssignmentRecommendationDto> generateEmergencyRecommendations(String taskId) {
        log.info("Generating emergency AI recommendations for task: {} using ai-service", taskId);

        try {
            ApiResponse<List<AssignmentRecommendationDto>> response =
                aiServiceClient.generateEmergencyRecommendations(taskId);

            return response.getResult();
        } catch (Exception e) {
            log.error("Error generating emergency AI recommendations for task: {}", taskId, e);
            throw new AppException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    /**
     * Generate team-based recommendations
     */
    public List<AssignmentRecommendationDto> generateTeamRecommendations(String taskId, String teamId) {
        log.info("Generating team AI recommendations for task: {} and team: {} using ai-service", taskId, teamId);

        try {
            ApiResponse<List<AssignmentRecommendationDto>> response =
                aiServiceClient.generateTeamRecommendations(taskId, teamId);

            return response.getResult();
        } catch (Exception e) {
            log.error("Error generating team AI recommendations for task: {} and team: {}", taskId, teamId, e);
            throw new AppException(ErrorCode.AI_SERVICE_ERROR);
        }
    }

    /**
     * Get AI-powered assignment recommendations (main method called by controller)
     */
    public List<AssignmentRecommendationDto> getAIRecommendations(String taskId) {
        log.info("Getting AI recommendations for task: {}", taskId);
        List<AssignmentRecommendationDto> recommendations = generateTaskRecommendations(taskId);

        // Enrich recommendations with user details
        return enrichRecommendationsWithUserDetails(recommendations);
    }

    /**
     * Enrich AI recommendations with user details from identity and profile services
     */
    private List<AssignmentRecommendationDto> enrichRecommendationsWithUserDetails(List<AssignmentRecommendationDto> recommendations) {
        log.info("Enriching {} recommendations with user details", recommendations.size());

        return recommendations.stream()
                .map(this::enrichWithUserDetails)
                .toList();
    }

    /**
     * Enrich a single recommendation with user details
     */
    private AssignmentRecommendationDto enrichWithUserDetails(AssignmentRecommendationDto recommendation) {
        try {
            // Fetch user details from identity service
            var userResponse = identityServiceClient.getUser(recommendation.getUserId());
            var user = userResponse.getResult();

            // Fetch profile details from profile service
            var profileResponse = profileServiceClient.getUserProfile(recommendation.getUserId());
            var profile = profileResponse.getResult();

            // Enrich the recommendation
            recommendation.setFirstName(user.getFirstName());
            recommendation.setLastName(user.getLastName());
            recommendation.setEmployeeId(user.getEmployeeId());
            recommendation.setPositionName(user.getPositionTitle());
            recommendation.setAvatar(profile.getAvatar());

            log.debug("Enriched recommendation for user: {} {} ({})",
                    user.getFirstName(), user.getLastName(), user.getEmployeeId());

        } catch (Exception e) {
            log.warn("Failed to enrich recommendation for userId: {}, error: {}",
                    recommendation.getUserId(), e.getMessage());
            // Continue with partial data - don't fail the entire recommendation
        }

        return recommendation;
    }
}
