package com.mnp.ai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiRecommendationService {

    @Value("${google.gemini.api.key}")
    private String geminiApiKey;

    @Value("${google.gemini.model}")
    private String model;

    private final ObjectMapper objectMapper;
    private final WebClient webClient;

    /**
     * Generate AI-powered task assignment recommendations using Gemini AI
     */
    public List<AssignmentRecommendation> generateGeminiRecommendations(
            TaskProfile task, List<UserProfile> candidates) {

        log.info("Generating Gemini AI recommendations for task: {} with {} candidates",
                task.getTaskId(), candidates.size());

        try {
            // Create context for Gemini AI
            String prompt = buildRecommendationPrompt(task, candidates);

            // Call Gemini AI for intelligent analysis
            String geminiResponse = callGeminiAPI(prompt);

            // Parse Gemini response and enhance recommendations
            List<AssignmentRecommendation> recommendations = parseGeminiRecommendations(
                    geminiResponse, task, candidates);

            // Apply team lead prioritization for High/Critical priority tasks
            recommendations = applyTeamLeadPrioritization(recommendations, task, candidates);

            log.info("Generated {} Gemini-enhanced recommendations", recommendations.size());
            return recommendations;

        } catch (Exception e) {
            log.error("Error generating Gemini recommendations: {}", e.getMessage(), e);
            return generateFallbackRecommendations(task, candidates);
        }
    }

    /**
     * Build comprehensive prompt for Gemini AI analysis
     */
    private String buildRecommendationPrompt(TaskProfile task, List<UserProfile> candidates) {
        StringBuilder prompt = new StringBuilder();

        prompt.append("Act as an expert project management AI assistant. Analyze the following task and team members to provide intelligent task assignment recommendations with detailed skill necessity analysis.\n\n");

        // Task information
        prompt.append("TASK DETAILS:\n");
        prompt.append("- Title: ").append(task.getTitle()).append("\n");
        prompt.append("- Description: ").append(task.getDescription()).append("\n");
        prompt.append("- Priority: ").append(task.getPriority()).append("\n");
        prompt.append("- Type: ").append(task.getTaskType()).append("\n");
        prompt.append("- Department: ").append(task.getDepartment()).append("\n");
        prompt.append("- Difficulty: ").append(task.getDifficulty()).append("\n");
        prompt.append("- Estimated Hours: ").append(task.getEstimatedHours()).append("\n");

        if (task.getRequiredSkills() != null && !task.getRequiredSkills().isEmpty()) {
            prompt.append("- Required Skills with Minimum Levels:\n");
            task.getRequiredSkills().forEach((skillName, skillLevel) -> {
                prompt.append("  * ").append(skillName).append(" (Level ").append(skillLevel).append("): ");
                // Add skill necessity explanation based on task type and description
                prompt.append(generateSkillNecessityExplanation(skillName, task)).append("\n");
            });
        }

        prompt.append("\nTEAM MEMBERS:\n");
        for (int i = 0; i < candidates.size() && i < 10; i++) { // Limit to 10 candidates for token efficiency
            UserProfile candidate = candidates.get(i);
            prompt.append("Member ").append(i + 1).append(":\n");
            prompt.append("  - ID: ").append(candidate.getUserId()).append("\n");
            prompt.append("  - Name: ").append(candidate.getName()).append("\n");
            prompt.append("  - Role: ").append(candidate.getRole()).append("\n");
            prompt.append("  - Department: ").append(candidate.getDepartment()).append("\n");
            prompt.append("  - Experience Years: ").append(candidate.getExperienceYears()).append("\n");
            prompt.append("  - Performance Rating: ").append(candidate.getPerformanceRating()).append("/5.0\n");
            prompt.append("  - Availability Score: ").append(candidate.getAvailabilityScore()).append("\n");
            prompt.append("  - Current Workload: ").append(candidate.getCurrentWorkLoadHours()).append(" hours\n");

            if (candidate.getSkills() != null && !candidate.getSkills().isEmpty()) {
                prompt.append("  - Skills with Proficiency Levels: ");
                candidate.getSkills().entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .limit(8)
                    .forEach(skill -> prompt.append(skill.getKey()).append("(").append(skill.getValue()).append(") "));
                prompt.append("\n");
            }
            prompt.append("\n");
        }

        prompt.append("\nANALYSIS REQUIREMENTS:\n");
        prompt.append("1. For HIGH or CRITICAL priority tasks, strongly prioritize team leads or senior members\n");
        prompt.append("2. Provide detailed skill necessity analysis explaining WHY each required skill is important for this specific task\n");
        prompt.append("3. Analyze skill gaps between required and candidate skill levels\n");
        prompt.append("4. Identify bonus skills that could be beneficial but aren't strictly required\n");
        prompt.append("5. Consider skill development opportunities for each candidate\n");
        prompt.append("6. Consider skill matching, experience level, current workload, and availability\n");
        prompt.append("7. Provide detailed reasoning for each recommendation\n");
        prompt.append("8. Rank candidates from most suitable to least suitable\n\n");

        prompt.append("Please provide your analysis in the following JSON format:\n");
        prompt.append("{\n");
        prompt.append("  \"recommendations\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"userId\": \"candidate_id\",\n");
        prompt.append("      \"rank\": 1,\n");
        prompt.append("      \"score\": 0.95,\n");
        prompt.append("      \"reasoning\": \"Detailed explanation of why this person is recommended\",\n");
        prompt.append("      \"skillAnalysis\": {\n");
        prompt.append("        \"matchedSkills\": [\"skill1\", \"skill2\"],\n");
        prompt.append("        \"missingSkills\": [\"skill3\"],\n");
        prompt.append("        \"skillGaps\": {\"skill1\": 0.2, \"skill2\": 0.0},\n");
        prompt.append("        \"bonusSkills\": [\"additional_skill1\"],\n");
        prompt.append("        \"skillMatchSummary\": \"Overall assessment of skill compatibility\",\n");
        prompt.append("        \"skillDevelopmentOpportunity\": \"How this task can help candidate grow\"\n");
        prompt.append("      },\n");
        prompt.append("      \"strengths\": [\"list of key strengths\"],\n");
        prompt.append("      \"risks\": [\"potential risks or concerns\"],\n");
        prompt.append("      \"isTeamLead\": true\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"taskSkillNecessity\": {\n");
        prompt.append("    \"skill1\": \"Explanation of why skill1 is crucial for this task\",\n");
        prompt.append("    \"skill2\": \"Explanation of why skill2 is needed\"\n");
        prompt.append("  },\n");
        prompt.append("  \"overallAnalysis\": \"Summary of the assignment strategy and key considerations\"\n");
        prompt.append("}\n");

        return prompt.toString();
    }

    /**
     * Generate skill necessity explanation based on task type and skill
     */
    private String generateSkillNecessityExplanation(String skill, TaskProfile task) {
        String taskType = task.getTaskType() != null ? task.getTaskType().toLowerCase() : "";
        String description = task.getDescription() != null ? task.getDescription().toLowerCase() : "";
        String skillLower = skill.toLowerCase();

        if (skillLower.contains("java") || skillLower.contains("spring")) {
            if (taskType.contains("backend") || description.contains("api") || description.contains("database")) {
                return "Essential for backend development, API creation, and database integration";
            }
            return "Required for server-side logic and enterprise application development";
        } else if (skillLower.contains("react") || skillLower.contains("javascript")) {
            if (taskType.contains("frontend") || description.contains("ui") || description.contains("interface")) {
                return "Critical for user interface development and interactive features";
            }
            return "Needed for dynamic frontend functionality and user experience";
        } else if (skillLower.contains("sql") || skillLower.contains("database")) {
            return "Required for data management, queries, and database optimization";
        } else if (skillLower.contains("html") || skillLower.contains("css")) {
            return "Essential for web page structure and styling";
        } else if (skillLower.contains("python")) {
            return "Needed for scripting, data processing, or backend development";
        } else if (skillLower.contains("docker")) {
            return "Required for containerization and deployment processes";
        } else if (skillLower.contains("aws") || skillLower.contains("cloud")) {
            return "Essential for cloud infrastructure and deployment";
        } else {
            return "Required for successful task completion based on project requirements";
        }
    }

    /**
     * Call Gemini API with the constructed prompt
     */
    private String callGeminiAPI(String prompt) {
        try {
            // Use simpler request structure that's compatible with gemini-2.5-flash
            Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                    Map.of("parts", List.of(
                        Map.of("text", prompt)
                    ))
                ),
                "generationConfig", Map.of(
                    "temperature", 0.3,
                    "maxOutputTokens", 8000  // Increased from 4000 to handle larger responses
                    // Removed responseMimeType as it may not be supported by gemini-2.5-flash
                )
            );

            String url = String.format(
                "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                model, geminiApiKey
            );

            log.info("Calling Gemini API for task assignment recommendations");
            log.debug("Request URL: {}", url);
            log.debug("Request body: {}", requestBody);

            String response = webClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

            log.info("Successfully received Gemini recommendation response");
            log.debug("Response length: {} characters", response != null ? response.length() : 0);

            String extractedText = extractTextFromGeminiResponse(response);
            log.debug("Extracted text length: {} characters", extractedText != null ? extractedText.length() : 0);

            return extractedText;

        } catch (Exception e) {
            log.error("Error calling Gemini API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get Gemini recommendations", e);
        }
    }

    /**
     * Extract text content from Gemini API response
     */
    private String extractTextFromGeminiResponse(String response) {
        try {
            JsonNode jsonResponse = objectMapper.readTree(response);
            JsonNode candidates = jsonResponse.get("candidates");

            if (candidates != null && candidates.isArray() && !candidates.isEmpty()) {
                JsonNode firstCandidate = candidates.get(0);
                JsonNode content = firstCandidate.get("content");
                JsonNode parts = content.get("parts");

                if (parts != null && parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).get("text").asText();
                }
            }

            log.warn("Unexpected Gemini response format: {}", response);
            return response;

        } catch (Exception e) {
            log.error("Error parsing Gemini response: {}", e.getMessage());
            return response;
        }
    }

    /**
     * Parse Gemini recommendations and convert to AssignmentRecommendation objects
     */
    private List<AssignmentRecommendation> parseGeminiRecommendations(
            String geminiResponse, TaskProfile task, List<UserProfile> candidates) {

        List<AssignmentRecommendation> recommendations = new ArrayList<>();

        try {
            // Extract JSON from Gemini response (it might contain markdown formatting)
            String jsonContent = extractJsonFromResponse(geminiResponse);
            JsonNode responseJson = objectMapper.readTree(jsonContent);

            // Extract skill necessity explanations for the task
            Map<String, String> taskSkillNecessity = new HashMap<>();
            JsonNode skillNecessityNode = responseJson.get("taskSkillNecessity");
            if (skillNecessityNode != null && skillNecessityNode.isObject()) {
                skillNecessityNode.fields().forEachRemaining(entry -> {
                    taskSkillNecessity.put(entry.getKey(), entry.getValue().asText());
                });
            }

            JsonNode recommendationsArray = responseJson.get("recommendations");
            if (recommendationsArray != null && recommendationsArray.isArray()) {

                for (JsonNode recNode : recommendationsArray) {
                    String userId = recNode.get("userId").asText();
                    UserProfile candidate = findCandidateById(userId, candidates);

                    if (candidate != null) {
                        AssignmentRecommendation recommendation = new AssignmentRecommendation();
                        recommendation.setUserId(userId);
                        recommendation.setTaskId(task.getTaskId());
                        recommendation.setRank(recNode.get("rank").asInt());
                        recommendation.setOverallScore(recNode.get("score").asDouble());
                        recommendation.setHybridScore(recNode.get("score").asDouble());

                        // Extract Gemini reasoning
                        String reasoning = recNode.get("reasoning").asText();
                        recommendation.setRecommendationReason(reasoning);
                        recommendation.setGeminiReasoning(reasoning);

                        // Set additional fields
                        if (recNode.has("isTeamLead")) {
                            recommendation.setIsTeamLead(recNode.get("isTeamLead").asBoolean());
                        }

                        // Extract detailed skill analysis
                        JsonNode skillAnalysisNode = recNode.get("skillAnalysis");
                        if (skillAnalysisNode != null) {
                            extractSkillAnalysis(recommendation, skillAnalysisNode, task, candidate, taskSkillNecessity);
                        } else {
                            // Generate basic skill analysis if not provided by AI
                            generateBasicSkillAnalysis(recommendation, task, candidate, taskSkillNecessity);
                        }

                        recommendations.add(recommendation);
                    }
                }
            }

        } catch (Exception e) {
            log.error("Error parsing Gemini recommendations: {}", e.getMessage(), e);
            return generateFallbackRecommendations(task, candidates);
        }

        return recommendations;
    }

    /**
     * Extract skill analysis from Gemini AI response
     */
    private void extractSkillAnalysis(AssignmentRecommendation recommendation, JsonNode skillAnalysisNode,
                                    TaskProfile task, UserProfile candidate, Map<String, String> taskSkillNecessity) {

        // Extract matched skills
        JsonNode matchedSkillsNode = skillAnalysisNode.get("matchedSkills");
        if (matchedSkillsNode != null && matchedSkillsNode.isArray()) {
            List<String> matchedSkills = new ArrayList<>();
            matchedSkillsNode.forEach(skill -> matchedSkills.add(skill.asText()));
            recommendation.setMatchedSkills(matchedSkills);
        }

        // Extract missing skills
        JsonNode missingSkillsNode = skillAnalysisNode.get("missingSkills");
        if (missingSkillsNode != null && missingSkillsNode.isArray()) {
            List<String> missingSkills = new ArrayList<>();
            missingSkillsNode.forEach(skill -> missingSkills.add(skill.asText()));
            recommendation.setMissingSkills(missingSkills);
        }

        // Extract skill gaps
        JsonNode skillGapsNode = skillAnalysisNode.get("skillGaps");
        if (skillGapsNode != null && skillGapsNode.isObject()) {
            Map<String, Double> skillGaps = new HashMap<>();
            skillGapsNode.fields().forEachRemaining(entry -> {
                skillGaps.put(entry.getKey(), entry.getValue().asDouble());
            });
            recommendation.setSkillGaps(skillGaps);
        }

        // Extract bonus skills
        JsonNode bonusSkillsNode = skillAnalysisNode.get("bonusSkills");
        if (bonusSkillsNode != null && bonusSkillsNode.isArray()) {
            List<String> bonusSkills = new ArrayList<>();
            bonusSkillsNode.forEach(skill -> bonusSkills.add(skill.asText()));
            recommendation.setBonusSkills(bonusSkills);
        }

        // Extract skill match summary
        JsonNode skillMatchSummaryNode = skillAnalysisNode.get("skillMatchSummary");
        if (skillMatchSummaryNode != null) {
            recommendation.setSkillMatchSummary(skillMatchSummaryNode.asText());
        }

        // Extract skill development opportunity
        JsonNode skillDevOpportunityNode = skillAnalysisNode.get("skillDevelopmentOpportunity");
        if (skillDevOpportunityNode != null) {
            recommendation.setSkillDevelopmentOpportunity(skillDevOpportunityNode.asText());
        }

        // Set skill necessity reasons based on task requirements
        recommendation.setSkillNecessityReasons(taskSkillNecessity);
    }

    /**
     * Generate basic skill analysis when AI doesn't provide detailed analysis
     */
    private void generateBasicSkillAnalysis(AssignmentRecommendation recommendation, TaskProfile task,
                                          UserProfile candidate, Map<String, String> taskSkillNecessity) {

        if (task.getRequiredSkills() == null || candidate.getSkills() == null) {
            return;
        }

        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();
        List<String> bonusSkills = new ArrayList<>();
        Map<String, Double> skillGaps = new HashMap<>();

        // Analyze each required skill
        for (Map.Entry<String, Double> requiredSkill : task.getRequiredSkills().entrySet()) {
            String skillName = requiredSkill.getKey();
            Double requiredLevel = requiredSkill.getValue();

            Double candidateLevel = candidate.getSkills().get(skillName);

            if (candidateLevel != null) {
                matchedSkills.add(skillName);
                if (candidateLevel < requiredLevel) {
                    skillGaps.put(skillName, requiredLevel - candidateLevel);
                }
            } else {
                missingSkills.add(skillName);
                skillGaps.put(skillName, requiredLevel);
            }
        }

        // Identify bonus skills (candidate has skills not required for task)
        for (String candidateSkill : candidate.getSkills().keySet()) {
            if (!task.getRequiredSkills().containsKey(candidateSkill)) {
                bonusSkills.add(candidateSkill);
            }
        }

        // Generate skill match summary
        StringBuilder summaryBuilder = new StringBuilder();
        summaryBuilder.append(String.format("Matches %d/%d required skills. ",
            matchedSkills.size(), task.getRequiredSkills().size()));

        if (!missingSkills.isEmpty()) {
            summaryBuilder.append(String.format("Missing: %s. ", String.join(", ", missingSkills)));
        }

        if (!bonusSkills.isEmpty()) {
            summaryBuilder.append(String.format("Bonus skills: %s.",
                String.join(", ", bonusSkills.subList(0, Math.min(3, bonusSkills.size())))));
        }

        // Set the analysis results
        recommendation.setMatchedSkills(matchedSkills);
        recommendation.setMissingSkills(missingSkills);
        recommendation.setSkillGaps(skillGaps);
        recommendation.setBonusSkills(bonusSkills);
        recommendation.setSkillMatchSummary(summaryBuilder.toString());
        recommendation.setSkillNecessityReasons(taskSkillNecessity);

        // Generate development opportunity
        if (!missingSkills.isEmpty()) {
            recommendation.setSkillDevelopmentOpportunity(
                String.format("This assignment could help develop skills in: %s",
                String.join(", ", missingSkills.subList(0, Math.min(2, missingSkills.size())))));
        } else {
            recommendation.setSkillDevelopmentOpportunity(
                "This assignment aligns well with current skill set and could reinforce existing expertise.");
        }
    }

    /**
     * Extract JSON content from Gemini response (remove markdown formatting)
     */
    private String extractJsonFromResponse(String response) {
        // Remove markdown code blocks if present
        String cleaned = response.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        }
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }

        // Check for truncated JSON and attempt to repair it
        cleaned = repairTruncatedJson(cleaned.trim());

        return cleaned;
    }

    /**
     * Attempt to repair truncated JSON by adding missing closing brackets/braces
     */
    private String repairTruncatedJson(String json) {
        try {
            // Try to parse as-is first
            objectMapper.readTree(json);
            return json; // JSON is valid, return as-is
        } catch (Exception e) {
            log.warn("JSON appears to be truncated, attempting to repair: {}", e.getMessage());

            // Count opening and closing brackets/braces
            int openBraces = countOccurrences(json, '{');
            int closeBraces = countOccurrences(json, '}');
            int openBrackets = countOccurrences(json, '[');
            int closeBrackets = countOccurrences(json, ']');

            StringBuilder repairedJson = new StringBuilder(json);

            // Remove any incomplete string at the end (common truncation point)
            String trimmed = removeIncompleteStringAtEnd(repairedJson.toString());
            repairedJson = new StringBuilder(trimmed);

            // Add missing closing brackets for arrays
            for (int i = 0; i < (openBrackets - closeBrackets); i++) {
                repairedJson.append("]");
            }

            // Add missing closing braces for objects
            for (int i = 0; i < (openBraces - closeBraces); i++) {
                repairedJson.append("}");
            }

            String repaired = repairedJson.toString();
            log.info("Attempting to use repaired JSON. Original length: {}, Repaired length: {}",
                    json.length(), repaired.length());

            try {
                // Validate the repaired JSON
                objectMapper.readTree(repaired);
                log.info("Successfully repaired truncated JSON");
                return repaired;
            } catch (Exception ex) {
                log.error("Failed to repair JSON: {}", ex.getMessage());
                // Return original even if invalid - let the calling method handle the fallback
                return json;
            }
        }
    }

    /**
     * Remove incomplete string at the end of JSON (common truncation point)
     */
    private String removeIncompleteStringAtEnd(String json) {
        // Find the last complete field before truncation
        int lastCompleteField = json.lastIndexOf("\",");
        if (lastCompleteField == -1) {
            lastCompleteField = json.lastIndexOf("\"}");
        }
        if (lastCompleteField == -1) {
            lastCompleteField = json.lastIndexOf("\"]");
        }

        if (lastCompleteField > 0) {
            // Check if there's an incomplete string after this point
            String afterLastField = json.substring(lastCompleteField + 1);
            if (afterLastField.contains("\":") && !afterLastField.trim().endsWith("}")
                && !afterLastField.trim().endsWith("]")) {
                // Likely truncated, return up to the last complete field
                return json.substring(0, lastCompleteField + 1);
            }
        }

        return json;
    }

    /**
     * Count occurrences of a character in a string
     */
    private int countOccurrences(String str, char ch) {
        return (int) str.chars().filter(c -> c == ch).count();
    }

    /**
     * Apply team lead prioritization for High/Critical priority tasks
     */
    private List<AssignmentRecommendation> applyTeamLeadPrioritization(
            List<AssignmentRecommendation> recommendations, TaskProfile task, List<UserProfile> candidates) {

        // Check if task has HIGH or CRITICAL priority
        String priority = task.getPriority();
        boolean isHighPriority = "HIGH".equalsIgnoreCase(priority) || "CRITICAL".equalsIgnoreCase(priority);

        if (!isHighPriority) {
            return recommendations; // No special prioritization needed
        }

        log.info("Applying team lead prioritization for {} priority task", priority);

        // Identify team leads and senior members
        List<AssignmentRecommendation> teamLeadRecommendations = new ArrayList<>();
        List<AssignmentRecommendation> regularRecommendations = new ArrayList<>();

        for (AssignmentRecommendation rec : recommendations) {
            UserProfile candidate = findCandidateById(rec.getUserId(), candidates);
            if (candidate != null && isTeamLeadOrSenior(candidate)) {
                rec.setIsTeamLead(true);
                // Boost score for team leads on high priority tasks
                double boostedScore = Math.min(1.0, rec.getOverallScore() + 0.2);
                rec.setOverallScore(boostedScore);
                rec.setHybridScore(boostedScore);

                // Enhance reasoning for team lead priority
                String enhancedReason = String.format(
                    "[HIGH PRIORITY TASK - TEAM LEAD PRIORITIZED] %s. As a team lead/senior member, they are well-suited for this %s priority task requiring strong leadership and technical expertise.",
                    rec.getRecommendationReason(), priority.toLowerCase()
                );
                rec.setRecommendationReason(enhancedReason);

                teamLeadRecommendations.add(rec);
            } else {
                regularRecommendations.add(rec);
            }
        }

        // Sort team leads by score (descending), then regular members
        teamLeadRecommendations.sort((r1, r2) -> Double.compare(r2.getOverallScore(), r1.getOverallScore()));
        regularRecommendations.sort((r1, r2) -> Double.compare(r2.getOverallScore(), r1.getOverallScore()));

        // Combine lists with team leads first
        List<AssignmentRecommendation> finalRecommendations = new ArrayList<>();
        finalRecommendations.addAll(teamLeadRecommendations);
        finalRecommendations.addAll(regularRecommendations);

        // Re-rank the combined list
        for (int i = 0; i < finalRecommendations.size(); i++) {
            finalRecommendations.get(i).setRank(i + 1);
        }

        log.info("Prioritized {} team leads and {} regular members for high priority task",
                teamLeadRecommendations.size(), regularRecommendations.size());

        return finalRecommendations;
    }

    /**
     * Check if a candidate is a team lead or senior member
     */
    private boolean isTeamLeadOrSenior(UserProfile candidate) {
        String role = candidate.getRole();
        if (role != null) {
            String roleLower = role.toLowerCase();
            if (roleLower.contains("lead") || roleLower.contains("senior") ||
                roleLower.contains("manager") || roleLower.contains("architect")) {
                return true;
            }
        }

        // Also consider experience level
        Double experience = candidate.getExperienceYears();
        if (experience != null && experience >= 5.0) {
            return true;
        }

        // Consider performance rating
        Double performance = candidate.getPerformanceRating();
        return performance != null && performance >= 4.0;
    }

    /**
     * Find candidate by ID in the candidates list
     */
    private UserProfile findCandidateById(String userId, List<UserProfile> candidates) {
        return candidates.stream()
            .filter(candidate -> candidate.getUserId().equals(userId))
            .findFirst()
            .orElse(null);
    }

    /**
     * Generate fallback recommendations if Gemini AI fails
     */
    private List<AssignmentRecommendation> generateFallbackRecommendations(
            TaskProfile task, List<UserProfile> candidates) {

        log.info("Generating fallback recommendations for task: {}", task.getTaskId());

        return candidates.stream()
            .limit(5) // Limit to top 5 candidates
            .map(candidate -> {
                AssignmentRecommendation rec = new AssignmentRecommendation();
                rec.setUserId(candidate.getUserId());
                rec.setTaskId(task.getTaskId());
                rec.setOverallScore(0.7); // Default score
                rec.setRecommendationReason("Fallback recommendation based on basic criteria matching");
                return rec;
            })
            .collect(Collectors.toList());
    }
}
