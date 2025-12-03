package com.mnp.ai.service;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.model.AssignmentRecommendation;
import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

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

        log.info(
                "Generating Gemini AI recommendations for task: {} with {} candidates",
                task.getTaskId(),
                candidates.size());

        try {
            // Filter candidates based on task creator's role
            List<UserProfile> filteredCandidates = filterCandidatesByCreatorRole(task, candidates);

            if (filteredCandidates.isEmpty()) {
                log.warn("No suitable candidates found after role filtering");
                return List.of();
            }

            log.info("Filtered to {} candidates based on creator role", filteredCandidates.size());

            // Create context for Gemini AI
            String prompt = buildRecommendationPrompt(task, filteredCandidates);

            // Call Gemini AI for intelligent analysis
            String geminiResponse = callGeminiAPI(prompt);

            // Parse Gemini response and enhance recommendations
            List<AssignmentRecommendation> recommendations =
                    parseGeminiRecommendations(geminiResponse, task, filteredCandidates);

            // Apply team lead prioritization for High/Critical priority tasks
            recommendations = applyTeamLeadPrioritization(recommendations, task, filteredCandidates);

            log.info("Generated {} Gemini-enhanced recommendations", recommendations.size());
            return recommendations;

        } catch (Exception e) {
            log.error("Error generating Gemini recommendations: {}", e.getMessage(), e);
            return generateFallbackRecommendations(task, candidates);
        }
    }

    /**
     * Filter candidates based on task creator's role
     * If task is created by TEAM_LEAD, only recommend EMPLOYEE role candidates
     */
    private List<UserProfile> filterCandidatesByCreatorRole(TaskProfile task, List<UserProfile> candidates) {
        // Get creator's profile to check their role
        String creatorId = task.getCreatedBy();
        if (creatorId == null || creatorId.isEmpty()) {
            log.debug("No creator ID found, returning all candidates");
            return candidates;
        }

        // Find creator in candidates list or assume they are a team lead if not in list
        UserProfile creator = candidates.stream()
                .filter(c -> c.getUserId().equals(creatorId))
                .findFirst()
                .orElse(null);

        boolean creatorIsTeamLead = false;
        if (creator != null) {
            String role = creator.getRole();
            creatorIsTeamLead = role != null
                    && (role.toUpperCase().contains("TEAM_LEAD")
                            || role.toUpperCase().contains("MANAGER")
                            || role.toUpperCase().contains("LEAD"));
        }

        // If creator is team lead, filter to only EMPLOYEE role candidates
        if (creatorIsTeamLead) {
            log.info("Task creator is TEAM_LEAD, filtering to EMPLOYEE role candidates only");
            return candidates.stream()
                    .filter(c -> {
                        String role = c.getRole();
                        return role != null && role.toUpperCase().equals("EMPLOYEE");
                    })
                    .toList();
        }

        // Otherwise, return all candidates
        log.debug("Task creator is not TEAM_LEAD, returning all candidates");
        return candidates;
    }

    /**
     * Build CONCISE prompt for Gemini AI analysis (optimized to avoid truncation)
     */
    private String buildRecommendationPrompt(TaskProfile task, List<UserProfile> candidates) {
        StringBuilder prompt = new StringBuilder();

        prompt.append(
                "You are a technical recruiter. Analyze candidates and write UNIQUE, SPECIFIC reasoning for EACH person.\n\n");

        // Task information - compact format
        prompt.append("TASK: ").append(task.getTitle()).append("\n");
        prompt.append("Priority: ")
                .append(task.getPriority())
                .append(" | Type: ")
                .append(task.getTaskType());
        prompt.append(" | Dept: ")
                .append(task.getDepartment())
                .append(" | Hours: ")
                .append(task.getEstimatedHours())
                .append("\n");

        if (task.getRequiredSkills() != null && !task.getRequiredSkills().isEmpty()) {
            prompt.append("Required Skills: ");
            task.getRequiredSkills()
                    .forEach((skill, level) ->
                            prompt.append(skill).append("(min:").append(level).append(") "));
            prompt.append("\n");
        }

        prompt.append("\nCANDIDATES:\n");
        for (int i = 0; i < Math.min(candidates.size(), 8); i++) {
            UserProfile c = candidates.get(i);
            prompt.append(i + 1)
                    .append(". ")
                    .append(c.getName())
                    .append(" [ID:")
                    .append(c.getUserId())
                    .append("]\n");
            prompt.append("   Role: ").append(c.getRole());
            prompt.append(" | Dept: ").append(c.getDepartment() != null ? c.getDepartment() : "N/A");
            prompt.append(" | Avail: ").append(c.getAvailabilityScore());
            prompt.append(" | Load: ").append(c.getCurrentWorkLoadHours()).append("h\n");

            if (c.getSkills() != null && !c.getSkills().isEmpty()) {
                prompt.append("   Skills: ");
                c.getSkills().entrySet().stream()
                        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                        .limit(6)
                        .forEach(s -> prompt.append(s.getKey())
                                .append("(")
                                .append(s.getValue())
                                .append(") "));
                prompt.append("\n");
            } else {
                prompt.append("   Skills: None listed\n");
            }
        }

        prompt.append("\nIMPORTANT INSTRUCTIONS:\n");
        prompt.append("1. Write DIFFERENT reasoning for EACH person - DO NOT repeat generic phrases\n");
        prompt.append("2. MENTION the person's NAME in their reasoning\n");
        prompt.append(
                "3. COMPARE their actual skill levels to required levels (e.g., 'Has React 5.0, exceeds requirement of 3.0' or 'Has React 2.5, below requirement of 4.0')\n");
        prompt.append("4. MENTION specific missing or weak skills by name\n");
        prompt.append("5. If TEAM_LEAD role and high priority: score higher; if EMPLOYEE: explain fit differently\n");
        prompt.append("6. Keep reasoning under 120 characters but make it UNIQUE\n");
        prompt.append("7. Score based on: skill match (50%), availability (20%), workload (15%), role fit (15%)\n\n");

        prompt.append("OUTPUT FORMAT (valid JSON only, NO markdown ```json):\n");
        prompt.append("{\n");
        prompt.append("  \"recommendations\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"userId\": \"exact-user-id-from-above\",\n");
        prompt.append("      \"rank\": 1,\n");
        prompt.append("      \"score\": 0.85,\n");
        prompt.append(
                "      \"reasoning\": \"[NAME] has [SPECIFIC SKILL] at level X, [comparison to requirement]. [Strength/weakness].\",\n");
        prompt.append("      \"skillAnalysis\": {\n");
        prompt.append("        \"matchedSkills\": [\"skill1\", \"skill2\"],\n");
        prompt.append("        \"missingSkills\": [\"skill3\"],\n");
        prompt.append("        \"skillMatchSummary\": \"Brief specific assessment\"\n");
        prompt.append("      },\n");
        prompt.append("      \"strengths\": [\"specific strength\"],\n");
        prompt.append("      \"risks\": [\"specific concern\"],\n");
        prompt.append("      \"isTeamLead\": false\n");
        prompt.append("    }\n");
        prompt.append("  ]\n");
        prompt.append("}\n\n");
        prompt.append(
                "EXAMPLE GOOD reasoning: \"David has React 5.0/TypeScript 5.0 exceeding requirements. Perfect frontend skills but missing E2E framework experience.\"\n");
        prompt.append(
                "EXAMPLE BAD reasoning: \"Good skill match for this task. Currently has light workload.\" (too generic!)\n");

        return prompt.toString();
    }

    /**
     * Generate skill necessity explanation based on task type and skill
     */
    private String generateSkillNecessityExplanation(String skill, TaskProfile task) {
        String taskType = task.getTaskType() != null ? task.getTaskType().toLowerCase() : "";
        String description =
                task.getDescription() != null ? task.getDescription().toLowerCase() : "";
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
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig",
                            Map.of(
                                    "temperature",
                                    0.2, // Lower temperature for more focused responses
                                    "maxOutputTokens",
                                    16000, // Increased to handle more candidates
                                    "topP",
                                    0.8,
                                    "topK",
                                    10));

            String url = String.format(
                    "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                    model, geminiApiKey);

            log.info("Calling Gemini API for task assignment recommendations");
            log.debug("Request URL: {}", url);
            log.debug("Request body: {}", requestBody);

            String response = webClient
                    .post()
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
                            recommendation.setIsTeamLead(
                                    recNode.get("isTeamLead").asBoolean());
                        }

                        // Extract detailed skill analysis
                        JsonNode skillAnalysisNode = recNode.get("skillAnalysis");
                        if (skillAnalysisNode != null) {
                            extractSkillAnalysis(
                                    recommendation, skillAnalysisNode, task, candidate, taskSkillNecessity);
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
    private void extractSkillAnalysis(
            AssignmentRecommendation recommendation,
            JsonNode skillAnalysisNode,
            TaskProfile task,
            UserProfile candidate,
            Map<String, String> taskSkillNecessity) {

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
    private void generateBasicSkillAnalysis(
            AssignmentRecommendation recommendation,
            TaskProfile task,
            UserProfile candidate,
            Map<String, String> taskSkillNecessity) {

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
        summaryBuilder.append(String.format(
                "Matches %d/%d required skills. ",
                matchedSkills.size(), task.getRequiredSkills().size()));

        if (!missingSkills.isEmpty()) {
            summaryBuilder.append(String.format("Missing: %s. ", String.join(", ", missingSkills)));
        }

        if (!bonusSkills.isEmpty()) {
            summaryBuilder.append(String.format(
                    "Bonus skills: %s.", String.join(", ", bonusSkills.subList(0, Math.min(3, bonusSkills.size())))));
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
            recommendation.setSkillDevelopmentOpportunity(String.format(
                    "This assignment could help develop skills in: %s",
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
            log.info(
                    "Attempting to use repaired JSON. Original length: {}, Repaired length: {}",
                    json.length(),
                    repaired.length());

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
        int length = json.length();

        // Find if we're in the middle of a string value
        int lastQuote = json.lastIndexOf("\"");
        if (lastQuote == -1) {
            return json;
        }

        // Count quotes to see if we have an odd number (incomplete string)
        long quoteCount = json.chars().filter(ch -> ch == '"').count();

        if (quoteCount % 2 != 0) {
            // Odd number of quotes means incomplete string
            // Find the position before the incomplete string started
            String beforeLastQuote = json.substring(0, lastQuote);
            int fieldStart = beforeLastQuote.lastIndexOf("\":");

            if (fieldStart > 0) {
                // Find the key name start
                int keyStart = beforeLastQuote.lastIndexOf("\"", fieldStart - 1);
                if (keyStart > 0) {
                    // Check if there's content before this incomplete field
                    String beforeField = json.substring(0, keyStart);
                    if (beforeField.trim().endsWith(",")) {
                        // Remove the trailing comma and return
                        return beforeField
                                .substring(0, beforeField.lastIndexOf(","))
                                .trim();
                    } else if (beforeField.trim().endsWith("{")
                            || beforeField.trim().endsWith("[")) {
                        // Just after opening brace/bracket, remove whole field
                        return beforeField.trim();
                    }
                }
            }

            // Fallback: just remove from the last complete field
            int lastComma = json.lastIndexOf(",\"");
            if (lastComma > 0) {
                return json.substring(0, lastComma);
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
                        rec.getRecommendationReason(), priority.toLowerCase());
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

        log.info(
                "Prioritized {} team leads and {} regular members for high priority task",
                teamLeadRecommendations.size(),
                regularRecommendations.size());

        return finalRecommendations;
    }

    /**
     * Check if a candidate is a team lead or senior member
     */
    private boolean isTeamLeadOrSenior(UserProfile candidate) {
        String role = candidate.getRole();
        if (role != null) {
            String roleLower = role.toLowerCase();
            if (roleLower.contains("lead")
                    || roleLower.contains("senior")
                    || roleLower.contains("manager")
                    || roleLower.contains("architect")) {
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

    /**
     * Generate a concise recommendation reason for a single candidate using Gemini AI
     * This is called after ML scoring to provide human-readable explanations
     */
    public String generateRecommendationReasonForCandidate(
            AssignmentRecommendation recommendation,
            TaskProfile task,
            UserProfile candidate) {

        log.debug("Generating Gemini AI reason for candidate {} on task {}",
                 candidate.getUserId(), task.getTaskId());

        try {
            String prompt = buildSingleCandidatePrompt(recommendation, task, candidate);
            String geminiResponse = callGeminiAPI(prompt);

            // Extract clean text from response (remove any JSON formatting if present)
            String cleanedReason = cleanReasoningText(geminiResponse);

            log.info("Generated Gemini reason for candidate {}: {}",
                    candidate.getUserId(), cleanedReason);

            return cleanedReason;

        } catch (Exception e) {
            log.error("Error generating Gemini reason for candidate {}: {}",
                     candidate.getUserId(), e.getMessage());
            return generateFallbackReason(recommendation, candidate);
        }
    }

    /**
     * Build a focused prompt for a single candidate recommendation
     */
    private String buildSingleCandidatePrompt(
            AssignmentRecommendation recommendation,
            TaskProfile task,
            UserProfile candidate) {

        StringBuilder prompt = new StringBuilder();

        prompt.append("You are an expert technical recruiter. Generate a concise, specific recommendation reason.\n\n");

        prompt.append("TASK DETAILS:\n");
        prompt.append("Title: ").append(task.getTitle()).append("\n");
        prompt.append("Priority: ").append(task.getPriority()).append("\n");
        prompt.append("Difficulty: ").append(task.getDifficulty() != null ? task.getDifficulty() : "N/A").append("\n");
        prompt.append("Estimated Hours: ").append(task.getEstimatedHours()).append("\n");

        if (task.getRequiredSkills() != null && !task.getRequiredSkills().isEmpty()) {
            prompt.append("Required Skills: ");
            task.getRequiredSkills().forEach((skill, level) ->
                prompt.append(skill).append(" (").append(String.format("%.1f", level)).append("), ")
            );
            prompt.append("\n");
        }

        prompt.append("\nCANDIDATE DETAILS:\n");
        prompt.append("Name: ").append(candidate.getName()).append("\n");
        prompt.append("Role: ").append(candidate.getRole()).append("\n");
        prompt.append("Department: ").append(candidate.getDepartment() != null ? candidate.getDepartment() : "N/A").append("\n");
        prompt.append("Seniority: ").append(candidate.getSeniorityLevel()).append("\n");
        prompt.append("Availability: ").append(candidate.getAvailabilityStatus()).append("\n");

        if (candidate.getSkills() != null && !candidate.getSkills().isEmpty()) {
            prompt.append("Skills: ");
            candidate.getSkills().entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                .limit(8)
                .forEach(entry ->
                    prompt.append(entry.getKey()).append(" (").append(String.format("%.1f", entry.getValue())).append("), ")
                );
            prompt.append("\n");
        }

        prompt.append("\nML EVALUATION SCORES:\n");
        prompt.append("Overall Score: ").append(String.format("%.2f%%", recommendation.getOverallScore() * 100)).append("\n");
        if (recommendation.getSkillMatchScore() != null) {
            prompt.append("Skill Match: ").append(String.format("%.2f%%", recommendation.getSkillMatchScore() * 100)).append("\n");
        }
        if (recommendation.getWorkloadScore() != null) {
            prompt.append("Workload Fit: ").append(String.format("%.2f%%", recommendation.getWorkloadScore() * 100)).append("\n");
        }
        if (recommendation.getPerformanceScore() != null) {
            prompt.append("Performance History: ").append(String.format("%.2f%%", recommendation.getPerformanceScore() * 100)).append("\n");
        }
        if (recommendation.getAvailabilityScore() != null) {
            prompt.append("Availability: ").append(String.format("%.2f%%", recommendation.getAvailabilityScore() * 100)).append("\n");
        }

        prompt.append("\nINSTRUCTIONS:\n");
        prompt.append("Generate a concise, professional recommendation reason (2-3 sentences max).\n");
        prompt.append("Focus on:\n");
        prompt.append("1. The candidate's NAME and key strengths\n");
        prompt.append("2. Specific skill matches or gaps (mention actual skill names)\n");
        prompt.append("3. Why they are suitable despite any limitations\n");
        prompt.append("4. Their availability and capacity if relevant\n\n");

        prompt.append("IMPORTANT: Return ONLY the recommendation text, no JSON, no markdown, no extra formatting.\n");
        prompt.append("Example good output: \"Sarah has strong React (4.5) and TypeScript (4.0) skills exceeding requirements. ");
        prompt.append("While missing Docker experience, her excellent availability and proven track record make her ideal for this frontend task.\"\n\n");
        prompt.append("Generate the recommendation reason now:");

        return prompt.toString();
    }

    /**
     * Clean reasoning text from Gemini response
     */
    private String cleanReasoningText(String response) {
        if (response == null) {
            return "Recommended based on ML evaluation.";
        }

        String cleaned = response.trim();

        // Remove markdown code blocks
        cleaned = cleaned.replaceAll("```json\\s*", "");
        cleaned = cleaned.replaceAll("```\\s*", "");

        // Remove JSON structure if present
        if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
            try {
                JsonNode jsonNode = objectMapper.readTree(cleaned);
                if (jsonNode.has("reasoning")) {
                    cleaned = jsonNode.get("reasoning").asText();
                } else if (jsonNode.has("reason")) {
                    cleaned = jsonNode.get("reason").asText();
                } else if (jsonNode.isArray() && jsonNode.size() > 0) {
                    cleaned = jsonNode.get(0).asText();
                }
            } catch (Exception e) {
                log.debug("Response is not JSON, using as-is");
            }
        }

        // Limit length if too long
        if (cleaned.length() > 500) {
            cleaned = cleaned.substring(0, 497) + "...";
        }

        return cleaned.trim();
    }

    /**
     * Generate fallback reason if Gemini AI fails
     */
    private String generateFallbackReason(AssignmentRecommendation recommendation, UserProfile candidate) {
        return String.format(
            "%s is recommended with an overall score of %.1f%%. Strong candidate based on ML evaluation of skills, availability, and performance history.",
            candidate.getName() != null ? candidate.getName() : "This candidate",
            recommendation.getOverallScore() * 100
        );
    }

    /**
     * Generate personalized reason using Gemini AI for a specific candidate and task
     * This method is called by HybridRecommendationAlgorithm for unique explanations
     */
    public String generatePersonalizedReason(String prompt) {
        log.debug("Generating personalized reason with Gemini AI");

        try {
            // Create a simplified request for just getting the reasoning text
            String reasoningPrompt =
                    "INSTRUCTIONS: Provide ONLY the 2-3 sentence explanation. No JSON, no formatting, just the text.\n\n"
                            + prompt;

            String geminiResponse = callGeminiAPI(reasoningPrompt);

            if (geminiResponse != null && !geminiResponse.trim().isEmpty()) {
                // Clean up the response - remove any JSON formatting, markdown, etc.
                String cleanReason = cleanReasoningResponse(geminiResponse);

                // Validate the response length and content
                if (cleanReason.length() > 20 && cleanReason.length() < 500) {
                    return cleanReason;
                }
            }

            log.warn("Gemini response was invalid or too short/long, response: {}", geminiResponse);
            return null;

        } catch (Exception e) {
            log.error("Error generating personalized reason with Gemini: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Clean up Gemini response to extract just the reasoning text
     */
    private String cleanReasoningResponse(String response) {
        if (response == null) {
            return "";
        }

        String cleaned = response.trim();

        // Remove markdown formatting
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.lastIndexOf("```"));
        }

        // Remove JSON structure if present
        if (cleaned.startsWith("{") && cleaned.contains("\"reasoning\":")) {
            try {
                JsonNode json = objectMapper.readTree(cleaned);
                JsonNode reasoningNode = json.get("reasoning");
                if (reasoningNode != null) {
                    cleaned = reasoningNode.asText();
                }
            } catch (Exception e) {
                // If JSON parsing fails, continue with text cleaning
            }
        }

        // Remove quotes if the entire response is wrapped in quotes
        if (cleaned.startsWith("\"") && cleaned.endsWith("\"")) {
            cleaned = cleaned.substring(1, cleaned.length() - 1);
        }

        // Remove any remaining instruction text that might have leaked through
        String[] unwantedPhrases = {
            "Here's the explanation:", "Explanation:", "Based on the analysis:", "REASONING:", "RESPONSE:"
        };

        for (String phrase : unwantedPhrases) {
            if (cleaned.startsWith(phrase)) {
                cleaned = cleaned.substring(phrase.length()).trim();
            }
        }

        // Clean up extra whitespace and ensure proper sentence structure
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        // Ensure it ends with proper punctuation
        if (!cleaned.isEmpty() && !cleaned.endsWith(".") && !cleaned.endsWith("!") && !cleaned.endsWith("?")) {
            cleaned += ".";
        }

        return cleaned;
    }
}
