package com.mnp.ai.service;

import com.mnp.ai.dto.request.TaskAnalysisRequest;
import com.mnp.ai.dto.response.TaskAnalysisResponse;
import com.mnp.ai.dto.response.TaskRecommendation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class AITaskRecommendationService {

    private final GeminiTaskAnalysisService geminiService;
    private final FileProcessingService fileProcessingService;

    public TaskAnalysisResponse analyzeTextContent(TaskAnalysisRequest request) {
        log.info("Starting Gemini AI analysis for text content, length: {} characters", request.getContent().length());

        long startTime = System.currentTimeMillis();

        List<TaskRecommendation> tasks = geminiService.analyzeAndGenerateTasks(
                request.getContent(),
                request.getProjectType(),
                request.getMethodology()
        );

        long processingTime = System.currentTimeMillis() - startTime;

        return TaskAnalysisResponse.builder()
                .tasks(tasks)
                .totalTasks(tasks.size())
                .analysisType("TEXT")
                .projectSummary(generateProjectSummary(request.getContent()))
                .suggestedMilestones(generateMilestones(tasks))
                .estimatedTotalHours(calculateTotalHours(tasks))
                .aiModel("Gemini-1.5-Pro")
                .processingTimeMs(processingTime)
                .build();
    }

    public TaskAnalysisResponse analyzeFileContent(MultipartFile file, String projectType, String methodology) {
        log.info("Starting Gemini AI analysis for file: {}, size: {} bytes", file.getOriginalFilename(), file.getSize());

        try {
            long startTime = System.currentTimeMillis();

            // Extract text content from file
            String extractedContent = fileProcessingService.extractTextFromFile(file);

            if (extractedContent == null || extractedContent.trim().isEmpty()) {
                throw new RuntimeException("Could not extract readable content from file");
            }

            List<TaskRecommendation> tasks = geminiService.analyzeAndGenerateTasks(
                    extractedContent,
                    projectType,
                    methodology
            );

            long processingTime = System.currentTimeMillis() - startTime;

            return TaskAnalysisResponse.builder()
                    .tasks(tasks)
                    .totalTasks(tasks.size())
                    .analysisType("FILE")
                    .projectSummary(generateProjectSummary(extractedContent))
                    .suggestedMilestones(generateMilestones(tasks))
                    .estimatedTotalHours(calculateTotalHours(tasks))
                    .aiModel("Gemini-1.5-Pro")
                    .processingTimeMs(processingTime)
                    .build();

        } catch (Exception e) {
            log.error("Error processing file for Gemini AI analysis: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to analyze file content: " + e.getMessage());
        }
    }

    private String generateProjectSummary(String content) {
        // Simple summary - first 200 characters or AI-generated summary
        if (content.length() <= 200) {
            return content;
        }
        return content.substring(0, 200) + "...";
    }

    private List<String> generateMilestones(List<TaskRecommendation> tasks) {
        // Generate milestones based on task types and priorities
        return List.of(
                "Project Setup & Planning",
                "Development Phase 1",
                "Testing & QA",
                "Deployment & Launch"
        );
    }

    private Integer calculateTotalHours(List<TaskRecommendation> tasks) {
        return tasks.stream()
                .mapToInt(task -> task.getEstimatedHours() != null ? task.getEstimatedHours() : 0)
                .sum();
    }
}
