package com.mnp.ai.controller;

import java.util.*;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.ai.dto.request.UserCreatedRequest;
import com.mnp.ai.dto.response.*;
import com.mnp.ai.entity.CVAnalysisHistory;
import com.mnp.ai.service.CVAnalysisHistoryService;
import com.mnp.ai.service.FileProcessingService;
import com.mnp.ai.service.GeminiCVAnalysisService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai/cv")
@RequiredArgsConstructor
@Slf4j
public class CVAnalysisController {

    private final FileProcessingService fileProcessingService;
    private final GeminiCVAnalysisService geminiCVAnalysisService;
    private final CVAnalysisHistoryService historyService;

    /**
     * Analyze CV file and extract comprehensive user profile information
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CVAnalysisResult> analyzeCVFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "extractSkills", defaultValue = "true") Boolean extractSkills,
            @RequestParam(value = "estimatePerformance", defaultValue = "true") Boolean estimatePerformance,
            @RequestParam(value = "parseExperience", defaultValue = "true") Boolean parseExperience,
            @AuthenticationPrincipal Jwt jwt) {

        long startTime = System.currentTimeMillis();

        log.info("Starting CV analysis for file: {}", file.getOriginalFilename());

        try {
            // Validate file
            if (file.isEmpty()) {
                return ApiResponse.<CVAnalysisResult>builder()
                        .code(4000)
                        .message("Uploaded file is empty")
                        .build();
            }

            // Validate file type
            String fileName = file.getOriginalFilename();
            if (!isValidCVFileType(fileName)) {
                return ApiResponse.<CVAnalysisResult>builder()
                        .code(4001)
                        .message("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.")
                        .build();
            }

            // Extract text content from CV file
            String cvContent = fileProcessingService.extractTextFromFile(file);

            if (cvContent == null || cvContent.trim().isEmpty()) {
                return ApiResponse.<CVAnalysisResult>builder()
                        .code(4002)
                        .message("Could not extract readable text from the CV file")
                        .build();
            }

            // Analyze CV using Gemini AI
            CVAnalysisResult analysisResult = geminiCVAnalysisService.analyzeCV(cvContent, fileName);

            // Calculate processing time
            long processingTime = System.currentTimeMillis() - startTime;
            analysisResult.setProcessingTime(processingTime);

            String uploadedBy = jwt != null ? jwt.getSubject() : "SYSTEM";
            // Lấy username từ JWT
            CVAnalysisHistory savedHistory = historyService.saveAnalysisHistory(
                    fileName, file.getSize(), file.getContentType(), analysisResult, uploadedBy);

            analysisResult.setHistoryId(savedHistory.getId());

            log.info(
                    "CV analysis completed for {} in {}ms with confidence: {}",
                    fileName,
                    processingTime,
                    analysisResult.getConfidence());

            return ApiResponse.<CVAnalysisResult>builder()
                    .code(1000)
                    .message("CV analyzed successfully")
                    .result(analysisResult)
                    .build();

        } catch (Exception e) {
            log.error("Error analyzing CV file: {}", e.getMessage(), e);
            // ✅ LƯU FAILED HISTORY
            try {
                String uploadedBy = jwt != null ? jwt.getSubject() : "SYSTEM";
                historyService.saveFailedAnalysis(
                        file.getOriginalFilename(), file.getSize(), file.getContentType(), e.getMessage(), uploadedBy);
            } catch (Exception historyEx) {
                log.error("Failed to save error history: {}", historyEx.getMessage());
            }
            return ApiResponse.<CVAnalysisResult>builder()
                    .code(5000)
                    .message("Internal error during CV analysis: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Batch analyze multiple CV files
     */
    @PostMapping(value = "/analyze/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<CVAnalysisResult>> analyzeBatchCVFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "extractSkills", defaultValue = "true") Boolean extractSkills,
            @RequestParam(value = "estimatePerformance", defaultValue = "true") Boolean estimatePerformance) {

        long startTime = System.currentTimeMillis();

        log.info("Starting batch CV analysis for {} files", files.length);

        try {
            List<CVAnalysisResult> results = new ArrayList<>();
            List<String> errors = new ArrayList<>();

            for (MultipartFile file : files) {
                try {
                    if (file.isEmpty()) {
                        errors.add("Skipped empty file: " + file.getOriginalFilename());
                        continue;
                    }

                    String fileName = file.getOriginalFilename();
                    if (!isValidCVFileType(fileName)) {
                        errors.add("Unsupported file type: " + fileName);
                        continue;
                    }

                    // Extract and analyze each CV
                    String cvContent = fileProcessingService.extractTextFromFile(file);
                    if (cvContent != null && !cvContent.trim().isEmpty()) {
                        CVAnalysisResult result = geminiCVAnalysisService.analyzeCV(cvContent, fileName);
                        results.add(result);
                        log.info("Successfully analyzed CV: {} (confidence: {})", fileName, result.getConfidence());
                    } else {
                        errors.add("Could not extract text from: " + fileName);
                    }

                } catch (Exception e) {
                    log.error("Failed to analyze CV: {}", file.getOriginalFilename(), e);
                    errors.add("Failed to analyze " + file.getOriginalFilename() + ": " + e.getMessage());
                }
            }

            long totalProcessingTime = System.currentTimeMillis() - startTime;

            log.info(
                    "Batch CV analysis completed: {} successful, {} errors, {}ms total",
                    results.size(),
                    errors.size(),
                    totalProcessingTime);

            String message =
                    String.format("Batch analysis completed: %d successful, %d failed", results.size(), errors.size());

            if (!errors.isEmpty()) {
                message += ". Errors: " + String.join("; ", errors);
            }

            return ApiResponse.<List<CVAnalysisResult>>builder()
                    .code(results.isEmpty() ? 4003 : 1000)
                    .message(message)
                    .result(results)
                    .build();

        } catch (Exception e) {
            log.error("Error in batch CV analysis: {}", e.getMessage(), e);

            return ApiResponse.<List<CVAnalysisResult>>builder()
                    .code(5000)
                    .message("Internal error during batch CV analysis: " + e.getMessage())
                    .build();
        }
    }

    private boolean isValidCVFileType(String fileName) {
        if (fileName == null) return false;

        String lowerFileName = fileName.toLowerCase();
        return lowerFileName.endsWith(".pdf")
                || lowerFileName.endsWith(".doc")
                || lowerFileName.endsWith(".docx")
                || lowerFileName.endsWith(".txt")
                || lowerFileName.endsWith(".rtf");
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<CVAnalysisHistoryResponse>> getAnalysisHistory() {
        return ApiResponse.<List<CVAnalysisHistoryResponse>>builder()
                .result(historyService.getAllHistory())
                .build();
    }

    /**
     * Get CV analysis statistics
     */
    @GetMapping("/history/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CVAnalysisStatsResponse> getAnalysisStats() {
        return ApiResponse.<CVAnalysisStatsResponse>builder()
                .result(historyService.getStatistics())
                .build();
    }

    /**
     * Get specific analysis history detail
     */
    @GetMapping("/history/{historyId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<CVAnalysisHistoryResponse> getHistoryDetail(@PathVariable String historyId) {
        return ApiResponse.<CVAnalysisHistoryResponse>builder()
                .result(historyService.getHistoryDetail(historyId))
                .build();
    }

    /**
     * Update history after user creation
     */
    @PutMapping("/history/{historyId}/user-created")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> markUserCreated(@PathVariable String historyId, @RequestBody UserCreatedRequest request) {
        historyService.updateHistoryWithCreatedUser(historyId, request);
        return ApiResponse.<Void>builder()
                .message("History updated successfully")
                .build();
    }
}
