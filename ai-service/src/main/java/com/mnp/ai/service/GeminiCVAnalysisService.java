package com.mnp.ai.service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.dto.response.CVAnalysisResult;
import com.mnp.ai.dto.response.ParsedUserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import reactor.core.publisher.Mono;

@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiCVAnalysisService {

    @Value("${google.gemini.api.key}")
    private String geminiApiKey;

    @Value("${google.gemini.model}")
    private String model;

    @Value("${google.gemini.max-tokens:16384}")
    private Integer maxTokens;

    @Value("${google.gemini.temperature:0.2}")
    private Double temperature;

    private final ObjectMapper objectMapper;
    private final WebClient webClient;
    private final IdentityIntegrationService identityIntegrationService;

    public CVAnalysisResult analyzeCV(String cvContent, String fileName) {
        log.info("Analyzing CV with Gemini AI: {}", fileName);

        try {
            // Validate API key
            if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
                throw new RuntimeException("Gemini API key not configured");
            }

            String prompt = createCVAnalysisPrompt(cvContent);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                    "generationConfig",
                            Map.of("temperature", temperature, "maxOutputTokens", maxTokens, "topP", 0.9, "topK", 10));

            String apiUrl = String.format(
                    "https://generativelanguage.googleapis.com/v1/models/%s:generateContent?key=%s",
                    model, geminiApiKey);

            log.info("Calling Gemini API for CV analysis");

            String response = webClient
                    .post()
                    .uri(apiUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .onStatus(status -> status.is4xxClientError(), clientResponse -> clientResponse
                            .bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error(
                                        "Gemini API 4xx error: {} - Response: {}",
                                        clientResponse.statusCode(),
                                        errorBody);
                                return Mono.error(new RuntimeException("Gemini API error: " + errorBody));
                            }))
                    .onStatus(status -> status.is5xxServerError(), serverResponse -> serverResponse
                            .bodyToMono(String.class)
                            .flatMap(errorBody -> {
                                log.error(
                                        "Gemini API 5xx error: {} - Response: {}",
                                        serverResponse.statusCode(),
                                        errorBody);
                                return Mono.error(new RuntimeException("Gemini API server error: " + errorBody));
                            }))
                    .bodyToMono(String.class)
                    .block();

            if (response != null) {
                log.info("Successfully received CV analysis response from Gemini");
                String aiResponse = extractTextFromGeminiResponse(response);
                return parseCVAnalysisResult(aiResponse, fileName);
            } else {
                throw new RuntimeException("Empty response from Gemini API");
            }

        } catch (Exception e) {
            log.error("Error analyzing CV with Gemini: {}", e.getMessage(), e);
            return createFallbackCVAnalysis(cvContent, fileName);
        }
    }

    private String createCVAnalysisPrompt(String cvContent) {
        // Get available departments and seniority levels from identity-service
        String availableDepartments = identityIntegrationService.getAvailableDepartments().stream()
                .map(dept -> dept.getName())
                .collect(Collectors.joining("|"));

        return String.format(
                """
			You are an expert HR analyst. Analyze this CV/Resume and extract comprehensive information in valid JSON format.

			CV Content:
			%s

			IMPORTANT: Use only these predefined values from the company's identity system:

			DEPARTMENTS (use exact names): %s

			SENIORITY LEVELS (use exact values): INTERN|JUNIOR|MID_LEVEL|SENIOR|LEAD|PRINCIPAL|DIRECTOR

			SKILL TYPES (use exact values): PROGRAMMING_LANGUAGE|FRAMEWORK|DATABASE|TOOL|DESIGN|SOFT_SKILL|DOMAIN_KNOWLEDGE

			PROFICIENCY LEVELS (use exact values): BEGINNER|INTERMEDIATE|ADVANCED|EXPERT|MASTER

			Extract and analyze the following information and return ONLY valid JSON with this exact structure:

			{
			"personalInfo": {
				"name": "Full Name",
				"email": "email@example.com",
				"phone": "phone number",
				"dateOfBirth": "YYYY-MM-DD or null if not found",
				"city": "City, Country",
				"linkedIn": "LinkedIn URL or null",
				"github": "GitHub URL or null"
			},
			"professionalSummary": {
				"title": "Current/Target Role",
				"experienceYears": 5.5,
				"department": "Must be one of: %s",
				"seniority": "Must be one of: INTERN|JUNIOR|MID_LEVEL|SENIOR|LEAD|PRINCIPAL|DIRECTOR"
			},
			"skills": [
				{
				"name": "Java",
				"type": "PROGRAMMING_LANGUAGE|FRAMEWORK|DATABASE|TOOL|DESIGN|SOFT_SKILL|DOMAIN_KNOWLEDGE",
				"proficiencyLevel": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT|MASTER",
				"yearsOfExperience": 3,
				"mandatory": true
				}
			],
			"workExperience": [
				{
				"company": "Company Name",
				"position": "Job Title",
				"startDate": "YYYY-MM-DD",
				"endDate": "YYYY-MM-DD or null if current",
				"duration": "2 years 3 months",
				"responsibilities": ["Key responsibility 1", "Key responsibility 2"],
				"achievements": ["Achievement 1", "Achievement 2"],
				"technologies": ["Tech1", "Tech2"]
				}
			],
			"education": [
				{
				"institution": "University Name",
				"degree": "Bachelor of Science",
				"field": "Computer Science",
				"graduationYear": 2020,
				"gpa": "3.8/4.0 or null"
				}
			],
			"certifications": [
				{
				"name": "AWS Certified Solutions Architect",
				"issuer": "Amazon Web Services",
				"issueDate": "YYYY-MM-DD",
				"expiryDate": "YYYY-MM-DD or null",
				"credentialId": "credential ID or null"
				}
			],
			"projects": [
				{
				"name": "Project Name",
				"description": "Brief description",
				"technologies": ["React", "Node.js", "MongoDB"],
				"role": "Lead Developer",
				"duration": "3 months",
				"achievements": ["Achievement 1", "Achievement 2"]
				}
			],
			"languages": [
				{
				"language": "English",
				"proficiency": "NATIVE|FLUENT|CONVERSATIONAL|BASIC"
				}
			],
			"performanceIndicators": {
				"estimatedProductivity": 0.85,
				"adaptabilityScore": 0.8,
				"leadershipPotential": 0.7,
				"technicalComplexityHandling": 0.9,
				"collaborationScore": 0.85
			}
			}

			Guidelines:
			- Extract only information explicitly mentioned in the CV
			- Use null for missing information, don't guess
			- MUST use exact department names from the provided list
			- MUST use exact seniority levels: INTERN, JUNIOR, MID_LEVEL, SENIOR, LEAD, PRINCIPAL, DIRECTOR
			- Map experience years to appropriate seniority: 0-1yr=INTERN, 1-2yr=JUNIOR, 2-5yr=MID_LEVEL, 5-8yr=SENIOR, 8-12yr=LEAD, 12-15yr=PRINCIPAL, 15+yr=DIRECTOR
			- Infer department from skills and experience (Frontend Development, Backend Development, Quality Assurance, DevOps, Mobile Development, Engineering)
			- Calculate experience years from work history if not explicitly stated
			- Infer skill proficiency from job responsibilities and years of experience
			- Set mandatory=true for core technical skills, false for nice-to-have
			- Performance indicators should be realistic estimates (0.0-1.0) based on experience level
			- Use standard date format YYYY-MM-DD
			- Group similar skills with appropriate types (React=FRAMEWORK, Java=PROGRAMMING_LANGUAGE, MySQL=DATABASE, Docker=TOOL, etc.)
			- Return ONLY the JSON object, no markdown or explanations
			""",
                cvContent, availableDepartments, availableDepartments);
    }

    private String extractTextFromGeminiResponse(String response) throws JsonProcessingException {
        JsonNode responseNode = objectMapper.readTree(response);
        JsonNode candidatesNode = responseNode.get("candidates");

        if (candidatesNode != null && candidatesNode.isArray() && candidatesNode.size() > 0) {
            JsonNode firstCandidate = candidatesNode.get(0);

            // Check finish reason to detect truncation
            JsonNode finishReasonNode = firstCandidate.get("finishReason");
            if (finishReasonNode != null && "MAX_TOKENS".equals(finishReasonNode.asText())) {
                log.warn("Gemini CV analysis response was truncated due to MAX_TOKENS limit");
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

        throw new RuntimeException("Could not extract text from Gemini CV analysis response");
    }

    private CVAnalysisResult parseCVAnalysisResult(String jsonResponse, String fileName) {
        try {
            // Clean the JSON response
            String cleanJson = cleanJsonResponse(jsonResponse);

            JsonNode rootNode = objectMapper.readTree(cleanJson);

            // Parse the structured CV data
            ParsedUserProfile userProfile = parseUserProfileFromJson(rootNode);

            return CVAnalysisResult.builder()
                    .fileName(fileName)
                    .success(true)
                    .userProfile(userProfile)
                    .rawAnalysis(cleanJson)
                    .confidence(calculateConfidence(rootNode))
                    .processingTime(System.currentTimeMillis())
                    .build();

        } catch (Exception e) {
            log.error("Error parsing CV analysis JSON: {}", e.getMessage());
            return createFallbackCVAnalysis("", fileName);
        }
    }

    private ParsedUserProfile parseUserProfileFromJson(JsonNode rootNode) {
        ParsedUserProfile.ParsedUserProfileBuilder builder = ParsedUserProfile.builder();

        // Parse personal information
        JsonNode personalInfo = rootNode.get("personalInfo");
        if (personalInfo != null) {
            builder.name(getStringValue(personalInfo, "name"))
                    .email(getStringValue(personalInfo, "email"))
                    .phone(getStringValue(personalInfo, "phone"))
                    .city(getStringValue(personalInfo, "city"))
                    .linkedIn(getStringValue(personalInfo, "linkedIn"))
                    .github(getStringValue(personalInfo, "github"));

            // Parse date of birth
            String dobStr = getStringValue(personalInfo, "dateOfBirth");
            if (dobStr != null && !dobStr.isEmpty() && !"null".equals(dobStr)) {
                try {
                    builder.dateOfBirth(LocalDate.parse(dobStr));
                } catch (DateTimeParseException e) {
                    log.warn("Could not parse date of birth: {}", dobStr);
                }
            }
        }

        // Parse professional summary with identity-service integration
        JsonNode professionalSummary = rootNode.get("professionalSummary");
        if (professionalSummary != null) {
            String department = getStringValue(professionalSummary, "department");
            String seniority = getStringValue(professionalSummary, "seniority");
            Double experienceYears = getDoubleValue(professionalSummary, "experienceYears", 0.0);

            // Validate and map department using identity-service
            if (department != null && !identityIntegrationService.isValidDepartment(department)) {
                log.warn("Invalid department '{}', mapping based on skills", department);
                // Parse skills first to determine department
                Map<String, Double> skills = parseSkillsFromJson(rootNode.get("skills"));
                department = identityIntegrationService.mapSkillsToDepartment(
                        skills, getStringValue(professionalSummary, "title"));
            }

            // Validate and map seniority using identity-service
            if (seniority != null && !identityIntegrationService.isValidSeniority(seniority)) {
                log.warn("Invalid seniority '{}', mapping based on experience", seniority);
                seniority = identityIntegrationService.mapExperienceToSeniority(experienceYears);
            }

            builder.currentRole(getStringValue(professionalSummary, "title"))
                    .department(department)
                    .seniority(seniority)
                    .experienceYears(experienceYears);
        }

        // Parse skills with enhanced validation
        JsonNode skillsNode = rootNode.get("skills");
        if (skillsNode != null && skillsNode.isArray()) {
            Map<String, Double> skills = new HashMap<>();
            Map<String, String> skillTypes = new HashMap<>();
            Map<String, Integer> skillExperience = new HashMap<>();
            List<String> mandatorySkills = new ArrayList<>();

            for (JsonNode skillNode : skillsNode) {
                String skillName = getStringValue(skillNode, "name");
                String skillType = getStringValue(skillNode, "type");
                String proficiencyLevel = getStringValue(skillNode, "proficiencyLevel");
                Integer yearsExp = getIntValue(skillNode, "yearsOfExperience", 0);
                Boolean mandatory = getBooleanValue(skillNode, "mandatory", false);

                if (skillName != null && !skillName.isEmpty()) {
                    skills.put(skillName, convertProficiencyToScore(proficiencyLevel));
                    skillTypes.put(skillName, skillType);
                    skillExperience.put(skillName, yearsExp);
                    if (mandatory) {
                        mandatorySkills.add(skillName);
                    }
                }
            }

            builder.skills(skills)
                    .skillTypes(skillTypes)
                    .skillExperience(skillExperience)
                    .mandatorySkills(mandatorySkills);
        }

        // Parse work experience
        JsonNode workExperienceNode = rootNode.get("workExperience");
        if (workExperienceNode != null && workExperienceNode.isArray()) {
            List<Map<String, Object>> workHistory = new ArrayList<>();
            for (JsonNode expNode : workExperienceNode) {
                Map<String, Object> experience = new HashMap<>();
                experience.put("company", getStringValue(expNode, "company"));
                experience.put("position", getStringValue(expNode, "position"));
                experience.put("startDate", getStringValue(expNode, "startDate"));
                experience.put("endDate", getStringValue(expNode, "endDate"));
                experience.put("duration", getStringValue(expNode, "duration"));
                experience.put("responsibilities", getStringListValue(expNode, "responsibilities"));
                experience.put("achievements", getStringListValue(expNode, "achievements"));
                experience.put("technologies", getStringListValue(expNode, "technologies"));
                workHistory.add(experience);
            }
            builder.workHistory(workHistory);
        }

        // Parse education
        JsonNode educationNode = rootNode.get("education");
        if (educationNode != null && educationNode.isArray()) {
            List<Map<String, Object>> education = new ArrayList<>();
            for (JsonNode eduNode : educationNode) {
                Map<String, Object> edu = new HashMap<>();
                edu.put("institution", getStringValue(eduNode, "institution"));
                edu.put("degree", getStringValue(eduNode, "degree"));
                edu.put("field", getStringValue(eduNode, "field"));
                edu.put("graduationYear", getIntValue(eduNode, "graduationYear", null));
                edu.put("gpa", getStringValue(eduNode, "gpa"));
                education.add(edu);
            }
            builder.education(education);
        }

        // Parse certifications
        JsonNode certificationsNode = rootNode.get("certifications");
        if (certificationsNode != null && certificationsNode.isArray()) {
            List<String> certifications = new ArrayList<>();
            List<Map<String, Object>> certificationsDetails = new ArrayList<>();

            for (JsonNode certNode : certificationsNode) {
                String certName = getStringValue(certNode, "name");
                if (certName != null && !certName.isEmpty()) {
                    certifications.add(certName);

                    Map<String, Object> certDetail = new HashMap<>();
                    certDetail.put("name", certName);
                    certDetail.put("issuer", getStringValue(certNode, "issuer"));
                    certDetail.put("issueDate", getStringValue(certNode, "issueDate"));
                    certDetail.put("expiryDate", getStringValue(certNode, "expiryDate"));
                    certDetail.put("credentialId", getStringValue(certNode, "credentialId"));
                    certificationsDetails.add(certDetail);
                }
            }

            builder.certifications(certifications).certificationsDetails(certificationsDetails);
        }

        // Parse projects
        JsonNode projectsNode = rootNode.get("projects");
        if (projectsNode != null && projectsNode.isArray()) {
            List<Map<String, Object>> projects = new ArrayList<>();
            for (JsonNode projectNode : projectsNode) {
                Map<String, Object> project = new HashMap<>();
                project.put("name", getStringValue(projectNode, "name"));
                project.put("description", getStringValue(projectNode, "description"));
                project.put("technologies", getStringListValue(projectNode, "technologies"));
                project.put("role", getStringValue(projectNode, "role"));
                project.put("duration", getStringValue(projectNode, "duration"));
                project.put("achievements", getStringListValue(projectNode, "achievements"));
                projects.add(project);
            }
            builder.projects(projects);
        }

        // Parse languages
        JsonNode languagesNode = rootNode.get("languages");
        if (languagesNode != null && languagesNode.isArray()) {
            Map<String, String> languages = new HashMap<>();
            for (JsonNode langNode : languagesNode) {
                String language = getStringValue(langNode, "language");
                String proficiency = getStringValue(langNode, "proficiency");
                if (language != null && proficiency != null) {
                    languages.put(language, proficiency);
                }
            }
            builder.languages(languages);
        }

        // Parse performance indicators
        JsonNode performanceNode = rootNode.get("performanceIndicators");
        if (performanceNode != null) {
            builder.estimatedProductivity(getDoubleValue(performanceNode, "estimatedProductivity", 0.7))
                    .adaptabilityScore(getDoubleValue(performanceNode, "adaptabilityScore", 0.7))
                    .leadershipPotential(getDoubleValue(performanceNode, "leadershipPotential", 0.5))
                    .technicalComplexityHandling(getDoubleValue(performanceNode, "technicalComplexityHandling", 0.7))
                    .collaborationScore(getDoubleValue(performanceNode, "collaborationScore", 0.8));
        }

        return builder.build();
    }

    private Map<String, Double> parseSkillsFromJson(JsonNode skillsNode) {
        Map<String, Double> skills = new HashMap<>();

        if (skillsNode != null && skillsNode.isArray()) {
            for (JsonNode skillNode : skillsNode) {
                String skillName = getStringValue(skillNode, "name");
                String proficiencyLevel = getStringValue(skillNode, "proficiencyLevel");

                if (skillName != null && !skillName.isEmpty()) {
                    skills.put(skillName, convertProficiencyToScore(proficiencyLevel));
                }
            }
        }

        return skills;
    }

    private String cleanJsonResponse(String jsonResponse) {
        String cleanJson = jsonResponse.trim();

        // Remove markdown code blocks
        if (cleanJson.startsWith("```json")) {
            cleanJson = cleanJson.substring(7);
        }
        if (cleanJson.startsWith("```")) {
            cleanJson = cleanJson.substring(3);
        }
        if (cleanJson.endsWith("```")) {
            cleanJson = cleanJson.substring(0, cleanJson.length() - 3);
        }

        return cleanJson.trim();
    }

    private Double convertProficiencyToScore(String proficiencyLevel) {
        if (proficiencyLevel == null) return 0.5;

        return switch (proficiencyLevel.toUpperCase()) {
            case "BEGINNER" -> 0.2;
            case "INTERMEDIATE" -> 0.5;
            case "ADVANCED" -> 0.8;
            case "EXPERT" -> 0.9;
            case "MASTER" -> 1.0;
            default -> 0.5;
        };
    }

    private Double calculateConfidence(JsonNode rootNode) {
        int filledFields = 0;
        int totalFields =
                7; // personalInfo, professionalSummary, skills, workExperience, education, certifications, projects

        if (rootNode.has("personalInfo") && rootNode.get("personalInfo").has("name")) filledFields++;
        if (rootNode.has("professionalSummary")) filledFields++;
        if (rootNode.has("skills")
                && rootNode.get("skills").isArray()
                && rootNode.get("skills").size() > 0) filledFields++;
        if (rootNode.has("workExperience")
                && rootNode.get("workExperience").isArray()
                && rootNode.get("workExperience").size() > 0) filledFields++;
        if (rootNode.has("education")
                && rootNode.get("education").isArray()
                && rootNode.get("education").size() > 0) filledFields++;
        if (rootNode.has("certifications")) filledFields++;
        if (rootNode.has("projects")) filledFields++;

        return (double) filledFields / totalFields;
    }

    private CVAnalysisResult createFallbackCVAnalysis(String cvContent, String fileName) {
        log.info("Creating fallback CV analysis with identity-service integration");

        // Create basic profile using identity-service mappings
        ParsedUserProfile basicProfile = ParsedUserProfile.builder()
                .name("Unknown")
                .experienceYears(1.0)
                .department("Engineering") // Default to Engineering department
                .seniority("JUNIOR") // Default seniority
                .skills(Map.of("General Programming", 0.5))
                .skillTypes(Map.of("General Programming", "PROGRAMMING_LANGUAGE"))
                .skillExperience(Map.of("General Programming", 1))
                .estimatedProductivity(0.7)
                .collaborationScore(0.8)
                .build();

        return CVAnalysisResult.builder()
                .fileName(fileName)
                .success(false)
                .userProfile(basicProfile)
                .rawAnalysis("Fallback analysis - Gemini service unavailable")
                .confidence(0.3)
                .processingTime(System.currentTimeMillis())
                .errorMessage("Gemini AI analysis failed, using fallback parsing with identity-service integration")
                .build();
    }

    // Utility methods for JSON parsing
    private String getStringValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.get(fieldName);
        if (fieldNode != null && !fieldNode.isNull() && !"null".equals(fieldNode.asText())) {
            return fieldNode.asText();
        }
        return null;
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

    private List<String> getStringListValue(JsonNode node, String fieldName) {
        List<String> result = new ArrayList<>();
        JsonNode arrayNode = node.get(fieldName);

        if (arrayNode != null && arrayNode.isArray()) {
            for (JsonNode item : arrayNode) {
                result.add(item.asText());
            }
        }

        return result;
    }
}
