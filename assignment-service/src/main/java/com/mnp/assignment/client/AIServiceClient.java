package com.mnp.assignment.client;

import com.mnp.assignment.configuration.FeignClientConfiguration;
import com.mnp.assignment.dto.AssignmentRecommendationDto;
import com.mnp.assignment.dto.request.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@FeignClient(name = "ai-service", url = "${app.services.ai}", fallback = AIServiceFallback.class, configuration = FeignClientConfiguration.class)
public interface AIServiceClient {

    @PostMapping("/ai/recommendations/task/{taskId}")
    ApiResponse<List<AssignmentRecommendationDto>> generateTaskRecommendations(@PathVariable String taskId);

    @PostMapping("/ai/recommendations/task/{taskId}/emergency")
    ApiResponse<List<AssignmentRecommendationDto>> generateEmergencyRecommendations(@PathVariable String taskId);

    @PostMapping("/ai/recommendations/task/{taskId}/team/{teamId}")
    ApiResponse<List<AssignmentRecommendationDto>> generateTeamRecommendations(@PathVariable String taskId, @PathVariable String teamId);

    // New methods for requirement import and analysis
    @PostMapping(value = "/ai/requirements/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<RequirementAnalysisResponse> importRequirementsFromFile(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("projectId") String projectId,
            @RequestParam(value = "projectName", required = false) String projectName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "generateTasks", defaultValue = "true") Boolean generateTasks,
            @RequestParam(value = "analyzeRequirements", defaultValue = "true") Boolean analyzeRequirements,
            @RequestParam(value = "detectConflicts", defaultValue = "true") Boolean detectConflicts,
            @RequestParam(value = "identifySkills", defaultValue = "true") Boolean identifySkills,
            @RequestParam(value = "additionalContext", required = false) String additionalContext,
            @RequestParam(value = "priority", defaultValue = "MEDIUM") String priority);

    @PostMapping("/ai/requirements/import/text")
    ApiResponse<RequirementAnalysisResponse> importRequirementsFromText(
            @RequestBody RequirementUploadRequest request,
            @RequestParam("requirementText") String requirementText);

    @GetMapping("/ai/requirements/analysis/{analysisId}")
    ApiResponse<String> getAnalysisStatus(@PathVariable String analysisId);

    @GetMapping("/ai/requirements/supported-types")
    ApiResponse<List<String>> getSupportedFileTypes();

    @GetMapping("/ai/health")
    ApiResponse<String> healthCheck();

    @GetMapping("/ai/capabilities")
    ApiResponse<AICapabilities> getCapabilities();

    // Supporting DTOs
    class RequirementAnalysisResponse {
        public String projectId;
        public String analysisId;
        public java.time.LocalDateTime processedAt;
        public java.util.List<String> processedFiles;
        public Integer totalRequirementsFound;
        public Integer totalTasksGenerated;
        public java.util.List<Object> requirements;
        public java.util.List<Object> recommendedTasks;
        public java.util.Map<String, Double> identifiedSkills;
        public java.util.List<String> detectedConflicts;
        public Double overallConfidenceScore;
        public String processingStatus;
        public java.util.List<String> warnings;
        public java.util.List<String> errors;
        public Long processingTimeMs;
        public String aiModelUsed;
        public Integer tokenCount;
    }

    class RequirementUploadRequest {
        public String projectId;
        public String projectName;
        public String description;
        public java.util.List<String> supportedFileTypes;
        public Boolean generateTasks;
        public Boolean analyzeRequirements;
        public Boolean detectConflicts;
        public Boolean identifySkills;
        public String additionalContext;
        public java.util.List<String> existingTaskIds;
        public String priority;
    }

    class AICapabilities {
        public Boolean supportsFileUpload;
        public Boolean supportsUrlImport;
        public Boolean supportsDirectTextInput;
        public Boolean supportsBatchProcessing;
        public java.util.List<String> supportedFileTypes;
        public Integer maxFileSizeMB;
        public Boolean canGenerateTasks;
        public Boolean canAnalyzeRequirements;
        public Boolean canDetectConflicts;
        public Boolean canIdentifySkills;
    }
}
