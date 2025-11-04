package com.mnp.ai.controller;

import com.mnp.ai.dto.request.TaskAnalysisRequest;
import com.mnp.ai.dto.response.TaskAnalysisResponse;
import com.mnp.ai.service.AITaskRecommendationService;
import com.mnp.ai.service.FileProcessingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/ai/tasks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class AITaskController {

    private final AITaskRecommendationService aiTaskService;
    private final FileProcessingService fileProcessingService;

    @PostMapping("/analyze-text")
    public ResponseEntity<TaskAnalysisResponse> analyzeText(@Valid @RequestBody TaskAnalysisRequest request) {
        log.info("Received text analysis request for content length: {}", request.getContent().length());

        try {
            TaskAnalysisResponse response = aiTaskService.analyzeTextContent(request);
            log.info("Successfully generated {} task recommendations", response.getTotalTasks());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error analyzing text content: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/analyze-file")
    public ResponseEntity<TaskAnalysisResponse> analyzeFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "projectType", required = false) String projectType,
            @RequestParam(value = "methodology", required = false, defaultValue = "AGILE") String methodology) {

        log.info("Received file analysis request for file: {} ({})",
                file.getOriginalFilename(), file.getSize());

        // Validate file
        if (file.isEmpty()) {
            log.warn("Empty file received");
            return ResponseEntity.badRequest().build();
        }

        if (!fileProcessingService.isSupportedFileType(file.getOriginalFilename())) {
            log.warn("Unsupported file type: {}", file.getOriginalFilename());
            return ResponseEntity.badRequest().build();
        }

        try {
            TaskAnalysisResponse response = aiTaskService.analyzeFileContent(file, projectType, methodology);
            log.info("Successfully generated {} task recommendations from file", response.getTotalTasks());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error analyzing file content: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/supported-formats")
    public ResponseEntity<String[]> getSupportedFormats() {
        return ResponseEntity.ok(new String[]{"pdf", "docx", "doc", "txt", "md"});
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("AI Task Service is running");
    }
}
