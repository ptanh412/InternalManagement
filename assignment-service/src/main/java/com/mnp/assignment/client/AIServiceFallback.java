package com.mnp.assignment.client;

import com.mnp.assignment.dto.AssignmentRecommendationDto;
import com.mnp.assignment.dto.request.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class AIServiceFallback implements AIServiceClient {

    @Override
    public ApiResponse<List<AssignmentRecommendationDto>> generateTaskRecommendations(String taskId) {
        log.warn("AI service is unavailable, returning empty recommendations for taskId: {}", taskId);

        return ApiResponse.<List<AssignmentRecommendationDto>>builder()
                .result(Collections.emptyList())
                .message("AI service unavailable - using fallback")
                .build();
    }

    @Override
    public ApiResponse<List<AssignmentRecommendationDto>> generateEmergencyRecommendations(String taskId) {
        log.warn("AI service is unavailable, returning empty emergency recommendations for taskId: {}", taskId);

        return ApiResponse.<List<AssignmentRecommendationDto>>builder()
                .result(Collections.emptyList())
                .message("AI service unavailable - using fallback")
                .build();
    }

    @Override
    public ApiResponse<List<AssignmentRecommendationDto>> generateTeamRecommendations(String taskId, String teamId) {
        log.warn("AI service is unavailable, returning empty team recommendations for taskId: {} and teamId: {}", taskId, teamId);

        return ApiResponse.<List<AssignmentRecommendationDto>>builder()
                .result(Collections.emptyList())
                .message("AI service unavailable - using fallback")
                .build();
    }

    @Override
    public ApiResponse<AIServiceClient.AICapabilities> getCapabilities() {
        log.warn("AI service is unavailable, returning fallback capabilities");

        // Create a fallback AICapabilities object
        AIServiceClient.AICapabilities fallbackCapabilities = new AIServiceClient.AICapabilities();
        fallbackCapabilities.supportsFileUpload = false;
        fallbackCapabilities.supportsUrlImport = false;
        fallbackCapabilities.supportsDirectTextInput = false;
        fallbackCapabilities.supportsBatchProcessing = false;
        fallbackCapabilities.supportedFileTypes = Collections.emptyList();
        fallbackCapabilities.maxFileSizeMB = 0;
        fallbackCapabilities.canGenerateTasks = false;
        fallbackCapabilities.canAnalyzeRequirements = false;
        fallbackCapabilities.canDetectConflicts = false;
        fallbackCapabilities.canIdentifySkills = false;

        return ApiResponse.<AIServiceClient.AICapabilities>builder()
                .result(fallbackCapabilities)
                .message("AI service unavailable - using fallback")
                .build();
    }

    @Override
    public ApiResponse<AIServiceClient.RequirementAnalysisResponse> importRequirementsFromFile(
            org.springframework.web.multipart.MultipartFile[] files,
            String projectId,
            String projectName,
            String description,
            Boolean generateTasks,
            Boolean analyzeRequirements,
            Boolean detectConflicts,
            Boolean identifySkills,
            String additionalContext,
            String priority) {
        log.warn("AI service is unavailable, cannot import requirements from file for projectId: {}", projectId);

        return ApiResponse.<AIServiceClient.RequirementAnalysisResponse>builder()
                .result(null)
                .message("AI service unavailable - cannot process file upload")
                .code(503)
                .build();
    }

    @Override
    public ApiResponse<AIServiceClient.RequirementAnalysisResponse> importRequirementsFromText(
            AIServiceClient.RequirementUploadRequest request,
            String requirementText) {
        log.warn("AI service is unavailable, cannot import requirements from text for projectId: {}",
                request != null ? request.projectId : "unknown");

        return ApiResponse.<AIServiceClient.RequirementAnalysisResponse>builder()
                .result(null)
                .message("AI service unavailable - cannot process text input")
                .code(503)
                .build();
    }

    @Override
    public ApiResponse<String> getAnalysisStatus(String analysisId) {
        log.warn("AI service is unavailable, cannot get analysis status for analysisId: {}", analysisId);

        return ApiResponse.<String>builder()
                .result("UNAVAILABLE")
                .message("AI service unavailable - cannot get analysis status")
                .code(503)
                .build();
    }

    @Override
    public ApiResponse<java.util.List<String>> getSupportedFileTypes() {
        log.warn("AI service is unavailable, returning empty supported file types");

        return ApiResponse.<java.util.List<String>>builder()
                .result(Collections.emptyList())
                .message("AI service unavailable - no file types supported")
                .code(503)
                .build();
    }

    @Override
    public ApiResponse<String> healthCheck() {
        log.warn("AI service is unavailable, health check failed");

        return ApiResponse.<String>builder()
                .result("DOWN")
                .message("AI service unavailable")
                .code(503)
                .build();
    }
}
