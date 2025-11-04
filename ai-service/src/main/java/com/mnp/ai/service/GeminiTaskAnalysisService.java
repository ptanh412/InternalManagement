package com.mnp.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.dto.response.RequiredSkill;
import com.mnp.ai.dto.response.TaskRecommendation;
import com.mnp.ai.enums.ProficiencyLevel;
import com.mnp.ai.enums.SkillType;
import com.mnp.ai.enums.TaskPriority;
import com.mnp.ai.enums.TaskType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiTaskAnalysisService {

    @Value("${google.gemini.api.key}")
    private String geminiApiKey;

    @Value("${google.gemini.model}")
    private String model;

    @Value("${google.gemini.max-tokens:8192}")
    private Integer maxTokens;

    @Value("${google.gemini.temperature:0.3}")
    private Double temperature;

    private final ObjectMapper objectMapper;
    private final WebClient webClient;

    // Thêm method này vào GeminiTaskAnalysisService để check available models
    private void listAvailableModels() {
        try {
            log.info("Fetching available Gemini models...");

            String listUrl = "https://generativelanguage.googleapis.com/v1/models?key=" + geminiApiKey;

            String response = webClient.get()
                    .uri(listUrl)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                log.info("Available models response: {}", response);

                // Parse and log model names
                JsonNode modelsNode = objectMapper.readTree(response);
                JsonNode modelsArray = modelsNode.get("models");

                if (modelsArray != null && modelsArray.isArray()) {
                    log.info("=== Available Gemini Models ===");
                    for (JsonNode modelNode : modelsArray) {
                        String modelName = modelNode.get("name").asText();
                        JsonNode supportedMethods = modelNode.get("supportedGenerationMethods");

                        // Only show models that support generateContent
                        if (supportedMethods != null && supportedMethods.toString().contains("generateContent")) {
                            // Extract just the model name (remove "models/" prefix)
                            String shortName = modelName.replace("models/", "");
                            log.info("  - {}", shortName);
                        }
                    }
                    log.info("================================");
                }
            }
        } catch (Exception e) {
            log.error("Failed to list models: {}", e.getMessage());
        }
    }

    // Cập nhật method testGeminiApiKey để gọi listAvailableModels khi test fail
    private boolean testGeminiApiKey() {
        try {
            log.info("Testing Gemini API key validity...");

            Map<String, Object> testBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", "Hello")
                            ))
                    )
            );

            String testUrl = String.format(
                    "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                    model, geminiApiKey
            );

            log.info("Testing with URL: {}", testUrl.replace(geminiApiKey, "***"));

            String response = webClient.post()
                    .uri(testUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(testBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        log.error("API key test 4xx error: {} - Response: {}",
                                                clientResponse.statusCode(), errorBody);

                                        // If model not found, list available models
                                        if (errorBody.contains("NOT_FOUND")) {
                                            log.error("Model '{}' not found! Listing available models...", model);
                                            listAvailableModels();
                                        }

                                        return Mono.error(new RuntimeException("API test failed: " + errorBody));
                                    }))
                    .bodyToMono(String.class)
                    .block();

            if (response != null && response.contains("candidates")) {
                log.info("API key test successful with model: {}", model);
                return true;
            } else {
                log.warn("API key test failed - unexpected response: {}", response);
                return false;
            }
        } catch (Exception e) {
            log.error("API key test failed: {}", e.getMessage());
            return false;
        }
    }

    // Also update the main API call
    public List<TaskRecommendation> analyzeAndGenerateTasks(String content, String projectType, String methodology) {
        log.info("Analyzing content with Google Gemini for task recommendations");

        try {
            // Validate API key first
            if (geminiApiKey == null || geminiApiKey.trim().isEmpty() || geminiApiKey.equals("your-gemini-api-key-here")) {
                log.error("Google Gemini API key is not configured properly");
                throw new RuntimeException("Gemini API key not configured");
            }

            log.info("Using model: {}", model);
            log.info("Using API key starting with: {}",
                    geminiApiKey.substring(0, Math.min(10, geminiApiKey.length())) + "...");

            // Test the API key first
            if (!testGeminiApiKey()) {
                log.error("API key test failed. Please verify your Gemini API key is valid");
                throw new RuntimeException("Invalid or unauthorized API key");
            }

            String prompt = createTaskAnalysisPrompt(content, projectType, methodology);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", prompt)
                            ))
                    ),
                    "generationConfig", Map.of(
                            "temperature", temperature,
                            "maxOutputTokens", maxTokens,
                            "topP", 0.8,
                            "topK", 10
                    )
            );

            // FIX: Use correct API endpoint with /v1/ instead of /v1beta/
            String apiUrl = String.format(
                    "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                    model, geminiApiKey
            );

            log.info("Calling Gemini API with model: {}", model);

            String response = webClient.post()
                    .uri(apiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        log.error("Gemini API 4xx error: {} - Response: {}",
                                                clientResponse.statusCode(), errorBody);
                                        return Mono.error(new RuntimeException("Gemini API error: " + errorBody));
                                    }))
                    .onStatus(status -> status.is5xxServerError(),
                            serverResponse -> serverResponse.bodyToMono(String.class)
                                    .flatMap(errorBody -> {
                                        log.error("Gemini API 5xx error: {} - Response: {}",
                                                serverResponse.statusCode(), errorBody);
                                        return Mono.error(new RuntimeException("Gemini API server error: " + errorBody));
                                    }))
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                log.info("Successfully received response from Gemini API");
                log.debug("Gemini response: {}", response);
                String aiResponse = extractTextFromGeminiResponse(response);
                log.info("Gemini analysis completed successfully");
                return parseTaskRecommendations(aiResponse);
            } else {
                throw new RuntimeException("Empty response from Gemini API");
            }

        } catch (Exception e) {
            log.error("Error analyzing content with Gemini: {}", e.getMessage(), e);
            log.info("Creating fallback tasks due to Gemini service unavailability");
            return createFallbackTasks(content);
        }
    }

    private String extractTextFromGeminiResponse(String response) throws JsonProcessingException {
        JsonNode responseNode = objectMapper.readTree(response);
        JsonNode candidatesNode = responseNode.get("candidates");

        if (candidatesNode != null && candidatesNode.isArray() && candidatesNode.size() > 0) {
            JsonNode firstCandidate = candidatesNode.get(0);

            // Check finish reason to detect truncation
            JsonNode finishReasonNode = firstCandidate.get("finishReason");
            if (finishReasonNode != null && "MAX_TOKENS".equals(finishReasonNode.asText())) {
                log.warn("Gemini response was truncated due to MAX_TOKENS limit. Response may be incomplete.");
            }

            JsonNode contentNode = firstCandidate.get("content");
            if (contentNode != null) {
                JsonNode partsNode = contentNode.get("parts");
                if (partsNode != null && partsNode.isArray() && partsNode.size() > 0) {
                    JsonNode textNode = partsNode.get(0).get("text");
                    if (textNode != null) {
                        return textNode.asText();
                    }
                }
            }
        }

        throw new RuntimeException("Could not extract text from Gemini response");
    }

    private String createTaskAnalysisPrompt(String content, String projectType, String methodology) {
        return String.format("""
            You are a senior project manager. Analyze the requirements and generate 6-8 actionable tasks in valid JSON format.

            Requirements:
            %s

            Project Type: %s | Methodology: %s

            Return ONLY valid JSON with this exact structure:

            {
              "tasks": [
                {
                  "title": "Short Task Title",
                  "description": "Brief description (max 120 chars)",
                  "priority": "HIGH|MEDIUM|LOW|CRITICAL",
                  "type": "FEATURE|TASK|STORY|RESEARCH|DOCUMENTATION|TESTING",
                  "estimatedHours": 8,
                  "tags": ["tag1", "tag2"],
                  "dependencies": [],
                  "assigneeRole": "FRONTEND_DEVELOPER|BACKEND_DEVELOPER|UI_UX_DESIGNER|QA_ENGINEER|DEVOPS_ENGINEER|PROJECT_MANAGER",
                  "confidenceScore": 0.85,
                  "requiredSkills": [
                    {
                      "skillType": "PROGRAMMING_LANGUAGE|FRAMEWORK|DATABASE|TOOL|DESIGN",
                      "requiredLevel": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT|MASTER",
                      "skillName": "JavaScript",
                      "mandatory": true
                    }
                  ]
                }
              ]
            }

            Guidelines:
            - Create 6-8 tasks maximum to fit response limits
            - Keep descriptions under 120 characters
            - Focus on essential development phases
            - Use realistic time estimates (4-40 hours)
            - Assign appropriate priorities and roles
            - Include 1-4 relevant skills per task based on the task requirements
            - Use specific skill names (e.g., "React", "Java", "MySQL", "Docker", "Figma")
            - Set mandatory=true for essential skills, false for nice-to-have
            - Match skill levels to task complexity
            - Return ONLY the JSON object, no markdown or explanations
            """, content, projectType != null ? projectType : "Software Development", methodology != null ? methodology : "AGILE");
    }

    private List<TaskRecommendation> parseTaskRecommendations(String jsonResponse) {
        List<TaskRecommendation> tasks = new ArrayList<>();

        try {
            // Clean the response - remove markdown code blocks if present
            String cleanJson = jsonResponse.trim();
            if (cleanJson.startsWith("```json")) {
                cleanJson = cleanJson.substring(7);
            }
            if (cleanJson.startsWith("```")) {
                cleanJson = cleanJson.substring(3);
            }
            if (cleanJson.endsWith("```")) {
                cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
            }

            // Handle truncated JSON by attempting to fix common truncation issues
            cleanJson = attemptJsonRepair(cleanJson);

            JsonNode rootNode = objectMapper.readTree(cleanJson);
            JsonNode tasksNode = rootNode.get("tasks");

            if (tasksNode != null && tasksNode.isArray()) {
                for (JsonNode taskNode : tasksNode) {
                    try {
                        TaskRecommendation task = TaskRecommendation.builder()
                                .title(getStringValue(taskNode, "title"))
                                .description(getStringValue(taskNode, "description"))
                                .priority(TaskPriority.valueOf(getStringValue(taskNode, "priority", "MEDIUM")))
                                .type(TaskType.valueOf(getStringValue(taskNode, "type", "TASK")))
                                .estimatedHours(getIntValue(taskNode, "estimatedHours", 8))
                                .tags(getStringList(taskNode, "tags"))
                                .dependencies(getStringList(taskNode, "dependencies"))
                                .assigneeRole(getStringValue(taskNode, "assigneeRole"))
                                .confidenceScore(getDoubleValue(taskNode, "confidenceScore", 0.8))
                                .requiredSkills(parseRequiredSkills(taskNode.get("requiredSkills")))
                                .build();

                        tasks.add(task);
                    } catch (Exception e) {
                        log.warn("Failed to parse individual task, skipping: {}", e.getMessage());
                        // Continue parsing other tasks
                    }
                }
            }

            log.info("Successfully parsed {} task recommendations from Gemini response", tasks.size());

        } catch (JsonProcessingException e) {
            log.error("Error parsing Gemini response JSON: {}", e.getMessage());
            log.debug("Raw Gemini response: {}", jsonResponse);

            // If we have at least some tasks parsed, return them instead of fallback
            if (!tasks.isEmpty()) {
                log.info("Returning {} partially parsed tasks instead of fallback", tasks.size());
                return tasks;
            }

            return createFallbackTasks("Failed to parse Gemini response");
        }

        // If no tasks were parsed but parsing didn't fail, create fallback
        if (tasks.isEmpty()) {
            log.warn("No tasks were parsed from Gemini response, using fallback");
            return createFallbackTasks("No tasks found in Gemini response");
        }

        return tasks;
    }

    private List<RequiredSkill> parseRequiredSkills(JsonNode skillsNode) {
        List<RequiredSkill> requiredSkills = new ArrayList<>();

        if (skillsNode != null && skillsNode.isArray()) {
            for (JsonNode skillNode : skillsNode) {
                try {
                    String skillType = getStringValue(skillNode, "skillType");
                    String requiredLevel = getStringValue(skillNode, "requiredLevel");
                    String skillName = getStringValue(skillNode, "skillName");
                    boolean mandatory = getBooleanValue(skillNode, "mandatory", false);

                    RequiredSkill requiredSkill = RequiredSkill.builder()
                            .skillType(SkillType.valueOf(skillType))
                            .requiredLevel(ProficiencyLevel.valueOf(requiredLevel))
                            .skillName(skillName)
                            .mandatory(mandatory)
                            .build();

                    requiredSkills.add(requiredSkill);
                } catch (Exception e) {
                    log.warn("Failed to parse required skill, skipping: {}", e.getMessage());
                }
            }
        }

        return requiredSkills;
    }

    /**
     * Attempt to repair common JSON truncation issues
     */
    private String attemptJsonRepair(String json) {
        try {
            // If JSON ends abruptly, try to close it properly
            if (!json.trim().endsWith("}")) {
                // Count open braces vs close braces to determine what to add
                long openBraces = json.chars().filter(ch -> ch == '{').count();
                long closeBraces = json.chars().filter(ch -> ch == '}').count();
                long openArrays = json.chars().filter(ch -> ch == '[').count();
                long closeArrays = json.chars().filter(ch -> ch == ']').count();

                StringBuilder repair = new StringBuilder(json);

                // Remove any trailing incomplete text (usually starts with a quote)
                String trimmed = repair.toString().trim();
                if (trimmed.endsWith(",")) {
                    repair = new StringBuilder(trimmed.substring(0, trimmed.length() - 1));
                } else if (trimmed.matches(".*\"[^\"]*$")) {
                    // Remove incomplete string at the end
                    int lastQuote = trimmed.lastIndexOf("\"");
                    if (lastQuote > 0) {
                        char beforeQuote = trimmed.charAt(lastQuote - 1);
                        if (beforeQuote == ':' || beforeQuote == ',') {
                            repair = new StringBuilder(trimmed.substring(0, lastQuote - 1));
                        }
                    }
                }

                // Close arrays first
                for (long i = closeArrays; i < openArrays; i++) {
                    repair.append("]");
                }

                // Close objects
                for (long i = closeBraces; i < openBraces; i++) {
                    repair.append("}");
                }

                return repair.toString();
            }

            return json;
        } catch (Exception e) {
            log.debug("JSON repair attempt failed: {}", e.getMessage());
            return json;
        }
    }

    private String getStringValue(JsonNode node, String fieldName) {
        return getStringValue(node, fieldName, "");
    }

    private String getStringValue(JsonNode node, String fieldName, String defaultValue) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asText() : defaultValue;
    }

    private Integer getIntValue(JsonNode node, String fieldName, Integer defaultValue) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asInt() : defaultValue;
    }

    private Double getDoubleValue(JsonNode node, String fieldName, Double defaultValue) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asDouble() : defaultValue;
    }

    private Boolean getBooleanValue(JsonNode node, String fieldName, Boolean defaultValue) {
        JsonNode fieldNode = node.get(fieldName);
        return fieldNode != null && !fieldNode.isNull() ? fieldNode.asBoolean() : defaultValue;
    }

    private List<String> getStringList(JsonNode node, String fieldName) {
        List<String> result = new ArrayList<>();
        JsonNode arrayNode = node.get(fieldName);

        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode item : arrayNode) {
                result.add(item.asText());
            }
        }

        return result;
    }

    private List<TaskRecommendation> createFallbackTasks(String content) {
        log.info("Creating fallback tasks due to Gemini service unavailability");

        return List.of(
                TaskRecommendation.builder()
                        .title("Project Setup and Configuration")
                        .description("Set up project structure, dependencies, and initial configuration files")
                        .priority(TaskPriority.HIGH)
                        .type(TaskType.TASK)
                        .estimatedHours(6)
                        .tags(Arrays.asList("setup", "configuration", "initialization"))
                        .assigneeRole("BACKEND_DEVELOPER")
                        .confidenceScore(0.9)
                        .requiredSkills(Arrays.asList(
                                RequiredSkill.builder()
                                        .skillType(SkillType.PROGRAMMING_LANGUAGE)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("Java")
                                        .mandatory(true)
                                        .build(),
                                RequiredSkill.builder()
                                        .skillType(SkillType.FRAMEWORK)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("Spring Boot")
                                        .mandatory(true)
                                        .build(),
                                RequiredSkill.builder()
                                        .skillType(SkillType.TOOL)
                                        .requiredLevel(ProficiencyLevel.BEGINNER)
                                        .skillName("Maven")
                                        .mandatory(false)
                                        .build()
                        ))
                        .build(),
                TaskRecommendation.builder()
                        .title("Requirements Analysis and Documentation")
                        .description("Analyze project requirements in detail and create comprehensive documentation")
                        .priority(TaskPriority.HIGH)
                        .type(TaskType.RESEARCH)
                        .estimatedHours(12)
                        .tags(Arrays.asList("analysis", "documentation", "planning"))
                        .assigneeRole("PROJECT_MANAGER")
                        .confidenceScore(0.85)
                        .requiredSkills(Arrays.asList(
                                RequiredSkill.builder()
                                        .skillType(SkillType.TOOL)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("Documentation Tools")
                                        .mandatory(true)
                                        .build(),
                                RequiredSkill.builder()
                                        .skillType(SkillType.DESIGN)
                                        .requiredLevel(ProficiencyLevel.BEGINNER)
                                        .skillName("Requirements Analysis")
                                        .mandatory(true)
                                        .build()
                        ))
                        .build(),
                TaskRecommendation.builder()
                        .title("Database Schema Design")
                        .description("Design and implement the database schema based on requirements")
                        .priority(TaskPriority.MEDIUM)
                        .type(TaskType.FEATURE)
                        .estimatedHours(8)
                        .tags(Arrays.asList("database", "schema", "design"))
                        .dependencies(Arrays.asList("Requirements Analysis and Documentation"))
                        .assigneeRole("BACKEND_DEVELOPER")
                        .confidenceScore(0.8)
                        .requiredSkills(Arrays.asList(
                                RequiredSkill.builder()
                                        .skillType(SkillType.DATABASE)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("MySQL")
                                        .mandatory(true)
                                        .build(),
                                RequiredSkill.builder()
                                        .skillType(SkillType.FRAMEWORK)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("JPA")
                                        .mandatory(true)
                                        .build(),
                                RequiredSkill.builder()
                                        .skillType(SkillType.DESIGN)
                                        .requiredLevel(ProficiencyLevel.INTERMEDIATE)
                                        .skillName("Database Design")
                                        .mandatory(true)
                                        .build()
                        ))
                        .build()
        );
    }
}
