package com.mnp.ai.controller;

import java.time.LocalDateTime;
import java.util.*;

import jakarta.validation.Valid;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.ai.dto.request.RequirementUploadRequest;
import com.mnp.ai.dto.response.ApiResponse;
import com.mnp.ai.dto.response.RequirementAnalysisResponse;
import com.mnp.ai.entity.AnalyzedRequirement;
import com.mnp.ai.entity.GeneratedTask;
import com.mnp.ai.enums.RequirementPriority;
import com.mnp.ai.service.FileProcessingService;
import com.mnp.ai.service.RequirementsAnalysisEngine;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai/requirements")
@RequiredArgsConstructor
@Slf4j
public class RequirementImportController {

    private final FileProcessingService fileProcessingService;
    private final RequirementsAnalysisEngine requirementsAnalysisEngine;

    /**
     * Import requirements from file and generate AI task recommendations
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<RequirementAnalysisResponse> importRequirementsFromFile(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("projectId") String projectId,
            @RequestParam(value = "projectName", required = false) String projectName,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "generateTasks", defaultValue = "true") Boolean generateTasks,
            @RequestParam(value = "analyzeRequirements", defaultValue = "true") Boolean analyzeRequirements,
            @RequestParam(value = "detectConflicts", defaultValue = "true") Boolean detectConflicts,
            @RequestParam(value = "identifySkills", defaultValue = "true") Boolean identifySkills,
            @RequestParam(value = "additionalContext", required = false) String additionalContext,
            @RequestParam(value = "priority", defaultValue = "MEDIUM") String priority) {

        long startTime = System.currentTimeMillis();
        String analysisId = UUID.randomUUID().toString();

        log.info("Starting requirement import for project: {} with {} files", projectId, files.length);

        try {
            List<String> processedFiles = new ArrayList<>();
            List<String> errors = new ArrayList<>();
            List<String> warnings = new ArrayList<>();
            StringBuilder combinedContent = new StringBuilder();

            // Process each uploaded file
            for (MultipartFile file : files) {
                try {
                    if (file.isEmpty()) {
                        warnings.add("Skipped empty file: " + file.getOriginalFilename());
                        continue;
                    }

                    // Validate file type
                    String fileName = file.getOriginalFilename();
                    if (!isValidFileType(fileName)) {
                        errors.add("Unsupported file type: " + fileName);
                        continue;
                    }

                    // Extract text content from file
                    String extractedText = fileProcessingService.extractTextFromFile(file);
                    combinedContent.append("\n\n=== ").append(fileName).append(" ===\n");
                    combinedContent.append(extractedText);
                    processedFiles.add(fileName);

                    log.info("Successfully processed file: {}", fileName);

                } catch (Exception e) {
                    log.error("Failed to process file: {}", file.getOriginalFilename(), e);
                    errors.add("Failed to process " + file.getOriginalFilename() + ": " + e.getMessage());
                }
            }

            if (processedFiles.isEmpty()) {
                return ApiResponse.<RequirementAnalysisResponse>builder()
                        .code(4000)
                        .message("No files could be processed successfully")
                        .result(RequirementAnalysisResponse.builder()
                                .projectId(projectId)
                                .analysisId(analysisId)
                                .processedAt(LocalDateTime.now())
                                .processingStatus("FAILED")
                                .errors(errors)
                                .warnings(warnings)
                                .processingTimeMs(System.currentTimeMillis() - startTime)
                                .build())
                        .build();
            }

            // Analyze requirements using AI engine
            List<AnalyzedRequirement> analyzedRequirements = new ArrayList<>();
            List<GeneratedTask> recommendedTasks = new ArrayList<>();
            Map<String, Double> identifiedSkills = new HashMap<>();
            List<String> detectedConflicts = new ArrayList<>();

            if (analyzeRequirements) {
                try {
                    analyzedRequirements =
                            requirementsAnalysisEngine.analyzeRequirements(combinedContent.toString(), projectId);
                    log.info("Analyzed {} requirements", analyzedRequirements.size());
                } catch (Exception e) {
                    log.error("Failed to analyze requirements", e);
                    errors.add("Requirements analysis failed: " + e.getMessage());
                }
            }

            if (generateTasks && !analyzedRequirements.isEmpty()) {
                try {
                    recommendedTasks = requirementsAnalysisEngine.generateTasksFromRequirements(analyzedRequirements);
                    log.info("Generated {} recommended tasks", recommendedTasks.size());
                } catch (Exception e) {
                    log.error("Failed to generate tasks", e);
                    errors.add("Task generation failed: " + e.getMessage());
                }
            }

            if (identifySkills) {
                try {
                    identifiedSkills = identifyRequiredSkillsFromText(combinedContent.toString());
                    log.info("Identified {} skill categories", identifiedSkills.size());
                } catch (Exception e) {
                    log.error("Failed to identify skills", e);
                    warnings.add("Skill identification failed: " + e.getMessage());
                }
            }

            if (detectConflicts && analyzedRequirements.size() > 1) {
                try {
                    detectedConflicts = detectRequirementConflicts(analyzedRequirements);
                    log.info("Detected {} potential conflicts", detectedConflicts.size());
                } catch (Exception e) {
                    log.error("Failed to detect conflicts", e);
                    warnings.add("Conflict detection failed: " + e.getMessage());
                }
            }

            // Calculate overall confidence score
            double overallConfidence = calculateOverallConfidence(analyzedRequirements, recommendedTasks);

            // Determine processing status
            String status = errors.isEmpty() ? "SUCCESS" : (processedFiles.isEmpty() ? "FAILED" : "PARTIAL");

            RequirementAnalysisResponse response = RequirementAnalysisResponse.builder()
                    .projectId(projectId)
                    .analysisId(analysisId)
                    .processedAt(LocalDateTime.now())
                    .processedFiles(processedFiles)
                    .totalRequirementsFound(analyzedRequirements.size())
                    .totalTasksGenerated(recommendedTasks.size())
                    .requirements(analyzedRequirements)
                    .recommendedTasks(recommendedTasks)
                    .identifiedSkills(identifiedSkills)
                    .detectedConflicts(detectedConflicts)
                    .overallConfidenceScore(overallConfidence)
                    .processingStatus(status)
                    .warnings(warnings)
                    .errors(errors)
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .aiModelUsed("Requirements Analysis Engine v1.0")
                    .tokenCount(combinedContent.length())
                    .build();

            log.info("Completed requirement import for project: {} in {}ms", projectId, response.getProcessingTimeMs());

            return ApiResponse.<RequirementAnalysisResponse>builder()
                    .result(response)
                    .message("Requirements imported and analyzed successfully")
                    .build();

        } catch (Exception e) {
            log.error("Unexpected error during requirement import", e);
            return ApiResponse.<RequirementAnalysisResponse>builder()
                    .code(5000)
                    .message("Internal server error during requirement processing")
                    .result(RequirementAnalysisResponse.builder()
                            .projectId(projectId)
                            .analysisId(analysisId)
                            .processedAt(LocalDateTime.now())
                            .processingStatus("FAILED")
                            .errors(Arrays.asList("Internal error: " + e.getMessage()))
                            .processingTimeMs(System.currentTimeMillis() - startTime)
                            .build())
                    .build();
        }
    }

    /**
     * Import requirements from direct text input
     */
    @PostMapping("/import/text")
    public ApiResponse<RequirementAnalysisResponse> importRequirementsFromText(
            @Valid @RequestBody RequirementUploadRequest request) {

        long startTime = System.currentTimeMillis();
        String analysisId = UUID.randomUUID().toString();
        List<String> warnings = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        log.info("Starting text-based requirement import for project: {}", request.getProjectId());

        try {
            // Validate that requirementText is provided
            if (request.getRequirementText() == null
                    || request.getRequirementText().trim().isEmpty()) {
                return ApiResponse.<RequirementAnalysisResponse>builder()
                        .code(4000)
                        .message("Requirement text is required")
                        .build();
            }

            String requirementText = request.getRequirementText();

            // Analyze requirements using AI engine
            List<AnalyzedRequirement> analyzedRequirements = new ArrayList<>();
            try {
                analyzedRequirements =
                        requirementsAnalysisEngine.analyzeRequirements(requirementText, request.getProjectId());
                log.info("Analyzed {} requirements", analyzedRequirements.size());
            } catch (Exception e) {
                log.error("Failed to analyze requirements", e);
                errors.add("Requirements analysis failed: " + e.getMessage());
            }

            // Generate tasks if requested
            List<GeneratedTask> recommendedTasks = new ArrayList<>();
            if (request.getGenerateTasks() && !analyzedRequirements.isEmpty()) {
                try {
                    recommendedTasks = requirementsAnalysisEngine.generateTasksFromRequirements(analyzedRequirements);
                    log.info("Generated {} recommended tasks", recommendedTasks.size());
                } catch (Exception e) {
                    log.error("Failed to generate tasks", e);
                    errors.add("Task generation failed: " + e.getMessage());
                }
            }

            // Identify skills if requested
            Map<String, Double> identifiedSkills = new HashMap<>();
            if (request.getIdentifySkills()) {
                try {
                    identifiedSkills = identifyRequiredSkillsFromText(requirementText);
                    log.info("Identified {} skill categories", identifiedSkills.size());
                    if (identifiedSkills.isEmpty()) {
                        warnings.add("No specific skills could be identified from the requirement text");
                    }
                } catch (Exception e) {
                    log.error("Failed to identify skills", e);
                    warnings.add("Skill identification failed: " + e.getMessage());
                }
            }

            // Detect conflicts if requested
            List<String> detectedConflicts = new ArrayList<>();
            if (request.getDetectConflicts()) {
                try {
                    if (analyzedRequirements.size() > 1) {
                        detectedConflicts = detectRequirementConflicts(analyzedRequirements);
                        log.info("Detected {} potential conflicts", detectedConflicts.size());
                    } else {
                        warnings.add("Conflict detection requires at least 2 requirements");
                    }
                } catch (Exception e) {
                    log.error("Failed to detect conflicts", e);
                    warnings.add("Conflict detection failed: " + e.getMessage());
                }
            }

            double overallConfidence = calculateOverallConfidence(analyzedRequirements, recommendedTasks);

            // Determine processing status
            String status = errors.isEmpty() ? "SUCCESS" : "PARTIAL";

            RequirementAnalysisResponse response = RequirementAnalysisResponse.builder()
                    .projectId(request.getProjectId())
                    .analysisId(analysisId)
                    .processedAt(LocalDateTime.now())
                    .processedFiles(Arrays.asList("Direct Text Input"))
                    .totalRequirementsFound(analyzedRequirements.size())
                    .totalTasksGenerated(recommendedTasks.size())
                    .requirements(analyzedRequirements)
                    .recommendedTasks(recommendedTasks)
                    .identifiedSkills(identifiedSkills)
                    .detectedConflicts(detectedConflicts)
                    .overallConfidenceScore(overallConfidence)
                    .processingStatus(status)
                    .warnings(warnings)
                    .errors(errors)
                    .processingTimeMs(System.currentTimeMillis() - startTime)
                    .aiModelUsed("Requirements Analysis Engine v1.0")
                    .tokenCount(requirementText.length())
                    .build();

            log.info(
                    "Completed text requirement analysis for project: {} in {}ms",
                    request.getProjectId(),
                    response.getProcessingTimeMs());

            return ApiResponse.<RequirementAnalysisResponse>builder()
                    .result(response)
                    .message("Text requirements analyzed successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error processing text requirements", e);
            errors.add("Internal error: " + e.getMessage());

            return ApiResponse.<RequirementAnalysisResponse>builder()
                    .code(5000)
                    .message("Failed to process text requirements")
                    .result(RequirementAnalysisResponse.builder()
                            .projectId(request.getProjectId())
                            .analysisId(analysisId)
                            .processedAt(LocalDateTime.now())
                            .processingStatus("FAILED")
                            .errors(errors)
                            .warnings(warnings)
                            .processingTimeMs(System.currentTimeMillis() - startTime)
                            .build())
                    .build();
        }
    }

    /**
     * Get analysis status by analysis ID
     */
    @GetMapping("/analysis/{analysisId}")
    public ApiResponse<String> getAnalysisStatus(@PathVariable String analysisId) {
        // This could be expanded to track analysis status in a cache or database
        return ApiResponse.<String>builder()
                .result("Analysis completed")
                .message("Analysis ID: " + analysisId)
                .build();
    }

    /**
     * Get supported file types
     */
    @GetMapping("/supported-types")
    public ApiResponse<List<String>> getSupportedFileTypes() {
        List<String> supportedTypes = Arrays.asList("PDF", "DOCX", "DOC", "TXT", "MD", "JSON", "XML");
        return ApiResponse.<List<String>>builder()
                .result(supportedTypes)
                .message("Supported file types for requirement import")
                .build();
    }

    private boolean isValidFileType(String fileName) {
        if (fileName == null) return false;
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return Arrays.asList("pdf", "docx", "doc", "txt", "md", "json", "xml").contains(extension);
    }

    private double calculateOverallConfidence(List<AnalyzedRequirement> requirements, List<GeneratedTask> tasks) {
        if (requirements.isEmpty()) return 0.0;

        double requirementConfidence = requirements.stream()
                .mapToDouble(req -> req.getComplexityScore() != null ? req.getComplexityScore() : 0.5)
                .average()
                .orElse(0.5);

        double taskConfidence = tasks.stream()
                .mapToDouble(task -> task.getConfidenceScore() != null ? task.getConfidenceScore() : 0.5)
                .average()
                .orElse(0.5);

        return (requirementConfidence + taskConfidence) / 2.0;
    }

    /**
     * Helper method to identify required skills from text content
     */
    private Map<String, Double> identifyRequiredSkillsFromText(String text) {
        Map<String, Double> skills = new HashMap<>();
        String lowerText = text.toLowerCase();

        // Email and notification related skills
        if (lowerText.contains("email") || lowerText.contains("notification") || lowerText.contains("smtp")) {
            skills.put("Email Integration", 3.0);
        }
        if (lowerText.contains("template") && (lowerText.contains("email") || lowerText.contains("notification"))) {
            skills.put("Template Engine", 2.5);
        }
        if (lowerText.contains("messaging") || lowerText.contains("queue") || lowerText.contains("async")) {
            skills.put("Message Queue", 3.0);
        }

        // Backend technologies
        if (lowerText.contains("java") || lowerText.contains("spring") || lowerText.contains("hibernate")) {
            skills.put("Java", 3.0);
        }
        if (lowerText.contains("spring boot") || lowerText.contains("spring framework")) {
            skills.put("Spring Framework", 3.0);
        }
        if (lowerText.contains("microservice") || lowerText.contains("rest api") || lowerText.contains("api")) {
            skills.put("API Development", 3.0);
        }

        // Frontend technologies
        if (lowerText.contains("javascript")
                || lowerText.contains("react")
                || lowerText.contains("angular")
                || lowerText.contains("vue")) {
            skills.put("JavaScript", 3.0);
        }
        if (lowerText.contains("frontend")
                || lowerText.contains("ui")
                || lowerText.contains("css")
                || lowerText.contains("html")) {
            skills.put("Frontend Development", 3.0);
        }

        // Database and storage
        if (lowerText.contains("database")
                || lowerText.contains("sql")
                || lowerText.contains("mysql")
                || lowerText.contains("postgresql")) {
            skills.put("Database", 3.0);
        }
        if (lowerText.contains("redis") || lowerText.contains("cache") || lowerText.contains("caching")) {
            skills.put("Caching", 2.5);
        }

        // Authentication and security
        if (lowerText.contains("authentication")
                || lowerText.contains("login")
                || lowerText.contains("register")
                || lowerText.contains("password")) {
            skills.put("Authentication", 3.0);
        }
        if (lowerText.contains("security") || lowerText.contains("jwt") || lowerText.contains("oauth")) {
            skills.put("Security", 3.0);
        }

        // Cloud and DevOps
        if (lowerText.contains("cloud")
                || lowerText.contains("aws")
                || lowerText.contains("azure")
                || lowerText.contains("docker")) {
            skills.put("Cloud Technologies", 3.0);
        }

        // Performance and scalability
        if (lowerText.contains("performance") || lowerText.contains("scalab") || lowerText.contains("optimization")) {
            skills.put("Performance Optimization", 2.5);
        }
        if (lowerText.contains("within") && lowerText.contains("second")) {
            skills.put("Real-time Processing", 3.0);
        }

        // Testing
        if (lowerText.contains("test") || lowerText.contains("quality")) {
            skills.put("Testing", 2.0);
        }

        // Other programming languages
        if (lowerText.contains("python") || lowerText.contains("django") || lowerText.contains("flask")) {
            skills.put("Python", 3.0);
        }
        if (lowerText.contains("node.js") || lowerText.contains("nodejs") || lowerText.contains("express")) {
            skills.put("Node.js", 3.0);
        }

        return skills;
    }

    /**
     * Helper method to detect conflicts between requirements
     */
    private List<String> detectRequirementConflicts(List<AnalyzedRequirement> requirements) {
        List<String> conflicts = new ArrayList<>();

        for (int i = 0; i < requirements.size(); i++) {
            for (int j = i + 1; j < requirements.size(); j++) {
                AnalyzedRequirement req1 = requirements.get(i);
                AnalyzedRequirement req2 = requirements.get(j);

                // Simple conflict detection based on content analysis
                String content1 = req1.getOriginalContent().toLowerCase();
                String content2 = req2.getOriginalContent().toLowerCase();

                // Check for conflicting priorities
                if (req1.getPriority() == RequirementPriority.CRITICAL
                        && req2.getPriority() == RequirementPriority.LOW) {
                    conflicts.add("Priority conflict between: " + req1.getTitle() + " and " + req2.getTitle());
                }

                // Check for technology conflicts
                if (content1.contains("mysql") && content2.contains("postgresql")) {
                    conflicts.add("Database technology conflict detected between requirements");
                }

                if (content1.contains("react") && content2.contains("angular")) {
                    conflicts.add("Frontend framework conflict detected between requirements");
                }
            }
        }

        return conflicts;
    }
}
