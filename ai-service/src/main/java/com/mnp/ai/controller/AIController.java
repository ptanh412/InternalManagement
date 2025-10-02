package com.mnp.ai.controller;

import org.springframework.web.bind.annotation.*;

import com.mnp.ai.dto.response.ApiResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
@Slf4j
public class AIController {

    /**
     * Health check for AI service
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.<String>builder()
                .result("AI Service is running - Requirements Analyzer ready")
                .message("File processing engines operational: PDF, DOCX, TXT, MD, JSON, XML supported")
                .build();
    }

    /**
     * Get AI service capabilities
     */
    @GetMapping("/capabilities")
    public ApiResponse<AICapabilities> getCapabilities() {
        AICapabilities capabilities = AICapabilities.builder()
                .supportsFileUpload(true)
                .supportsUrlImport(true)
                .supportsDirectTextInput(true)
                .supportsBatchProcessing(true)
                .supportedFileTypes(java.util.List.of("PDF", "DOCX", "TXT", "MD", "JSON", "XML"))
                .maxFileSizeMB(10)
                .canGenerateTasks(true)
                .canAnalyzeRequirements(true)
                .canDetectConflicts(true)
                .canIdentifySkills(true)
                .build();

        return ApiResponse.<AICapabilities>builder()
                .result(capabilities)
                .message("AI Requirements Analyzer is fully operational")
                .build();
    }

    @lombok.Builder
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AICapabilities {
        Boolean supportsFileUpload;
        Boolean supportsUrlImport;
        Boolean supportsDirectTextInput;
        Boolean supportsBatchProcessing;
        java.util.List<String> supportedFileTypes;
        Integer maxFileSizeMB;
        Boolean canGenerateTasks;
        Boolean canAnalyzeRequirements;
        Boolean canDetectConflicts;
        Boolean canIdentifySkills;
    }
}
