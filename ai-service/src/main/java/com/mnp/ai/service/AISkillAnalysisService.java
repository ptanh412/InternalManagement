package com.mnp.ai.service;

import java.util.*;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.mnp.ai.dto.response.TaskRequiredSkillResponse;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class AISkillAnalysisService {

    // Comprehensive skill pattern mappings with proficiency indicators
    private static final Map<String, SkillPattern> SKILL_PATTERNS = new HashMap<>();

    static {
        // Authentication & Security Skills - Specific technologies
        SKILL_PATTERNS.put(
                "AUTHENTICATION",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(auth|authentication|login|oauth|jwt|session|security)\\b",
                                Pattern.CASE_INSENSITIVE),
                        "SECURITY",
                        "Spring Security",
                        "ADVANCED",
                        true));

        SKILL_PATTERNS.put(
                "JWT",
                new SkillPattern(
                        Pattern.compile("\\b(jwt|token|oauth|authentication)\\b", Pattern.CASE_INSENSITIVE),
                        "SECURITY",
                        "JWT (JSON Web Tokens)",
                        "ADVANCED",
                        true));

        // CRUD Operations - Specific backend technologies
        SKILL_PATTERNS.put(
                "SPRING_BOOT",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(create|read|update|delete|crud|backend|server|api)\\b", Pattern.CASE_INSENSITIVE),
                        "FRAMEWORK",
                        "Spring Boot",
                        "INTERMEDIATE",
                        true));

        SKILL_PATTERNS.put(
                "JAVA",
                new SkillPattern(
                        Pattern.compile("\\b(java|spring|boot|mvc|enterprise)\\b", Pattern.CASE_INSENSITIVE),
                        "PROGRAMMING_LANGUAGE",
                        "Java",
                        "INTERMEDIATE",
                        true));

        SKILL_PATTERNS.put(
                "REST_API",
                new SkillPattern(
                        Pattern.compile("\\b(api|rest|endpoint|service|microservice)\\b", Pattern.CASE_INSENSITIVE),
                        "API_TECHNOLOGY",
                        "REST API",
                        "INTERMEDIATE",
                        true));

        // Database Skills - Specific databases
        SKILL_PATTERNS.put(
                "POSTGRESQL",
                new SkillPattern(
                        Pattern.compile("\\b(database|db|sql|nosql|crud|data|storage)\\b", Pattern.CASE_INSENSITIVE),
                        "DATABASE",
                        "PostgreSQL",
                        "INTERMEDIATE",
                        true));

        SKILL_PATTERNS.put(
                "JPA_HIBERNATE",
                new SkillPattern(
                        Pattern.compile("\\b(database|db|sql|crud|data)\\b", Pattern.CASE_INSENSITIVE),
                        "FRAMEWORK",
                        "JPA/Hibernate",
                        "INTERMEDIATE",
                        true));

        // Real-time Features - Specific technologies
        SKILL_PATTERNS.put(
                "WEBSOCKET",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(real.?time|notification|websocket|socket|live|push)\\b", Pattern.CASE_INSENSITIVE),
                        "BACKEND_TECHNOLOGY",
                        "WebSocket",
                        "ADVANCED",
                        true));

        SKILL_PATTERNS.put(
                "STOMP",
                new SkillPattern(
                        Pattern.compile("\\b(real.?time|notification|message|push)\\b", Pattern.CASE_INSENSITIVE),
                        "BACKEND_TECHNOLOGY",
                        "STOMP Messaging",
                        "ADVANCED",
                        true));

        // File Handling - Specific technologies
        SKILL_PATTERNS.put(
                "MULTIPART_FILE",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(file|upload|download|storage|document|attachment)\\b", Pattern.CASE_INSENSITIVE),
                        "API_TECHNOLOGY",
                        "Multipart File Upload",
                        "INTERMEDIATE",
                        true));

        SKILL_PATTERNS.put(
                "AWS_S3",
                new SkillPattern(
                        Pattern.compile("\\b(file|upload|storage|cloud|aws)\\b", Pattern.CASE_INSENSITIVE),
                        "CLOUD_PLATFORM",
                        "AWS S3",
                        "INTERMEDIATE",
                        false));

        // Performance & Optimization - Specific tools
        SKILL_PATTERNS.put(
                "REDIS",
                new SkillPattern(
                        Pattern.compile("\\b(performance|cache|redis|fast|speed)\\b", Pattern.CASE_INSENSITIVE),
                        "DATABASE",
                        "Redis",
                        "INTERMEDIATE",
                        false));

        SKILL_PATTERNS.put(
                "JVM_TUNING",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(performance|respond|seconds|speed|optimization|memory)\\b",
                                Pattern.CASE_INSENSITIVE),
                        "PERFORMANCE_OPTIMIZATION",
                        "JVM Performance Tuning",
                        "ADVANCED",
                        false));

        // Frontend Skills - Specific technologies
        SKILL_PATTERNS.put(
                "REACT",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(ui|interface|frontend|client|user|view|display)\\b", Pattern.CASE_INSENSITIVE),
                        "FRAMEWORK",
                        "React.js",
                        "INTERMEDIATE",
                        false));

        SKILL_PATTERNS.put(
                "JAVASCRIPT",
                new SkillPattern(
                        Pattern.compile("\\b(javascript|js|frontend|client)\\b", Pattern.CASE_INSENSITIVE),
                        "PROGRAMMING_LANGUAGE",
                        "JavaScript",
                        "INTERMEDIATE",
                        false));

        SKILL_PATTERNS.put(
                "HTML_CSS",
                new SkillPattern(
                        Pattern.compile("\\b(ui|interface|frontend|html|css|styling)\\b", Pattern.CASE_INSENSITIVE),
                        "FRONTEND_TECHNOLOGY",
                        "HTML/CSS",
                        "INTERMEDIATE",
                        false));

        // Testing Skills - Specific tools
        SKILL_PATTERNS.put(
                "JUNIT",
                new SkillPattern(
                        Pattern.compile(
                                "\\b(test|testing|quality|validation|verify|junit)\\b", Pattern.CASE_INSENSITIVE),
                        "TESTING_TOOL",
                        "JUnit",
                        "INTERMEDIATE",
                        false));

        SKILL_PATTERNS.put(
                "MOCKITO",
                new SkillPattern(
                        Pattern.compile("\\b(test|testing|mock|unit.?test)\\b", Pattern.CASE_INSENSITIVE),
                        "TESTING_TOOL",
                        "Mockito",
                        "INTERMEDIATE",
                        false));

        // DevOps & Deployment - Specific tools
        SKILL_PATTERNS.put(
                "DOCKER",
                new SkillPattern(
                        Pattern.compile("\\b(docker|container|deployment|devops)\\b", Pattern.CASE_INSENSITIVE),
                        "DEVOPS_TOOL",
                        "Docker",
                        "INTERMEDIATE",
                        false));

        SKILL_PATTERNS.put(
                "KUBERNETES",
                new SkillPattern(
                        Pattern.compile("\\b(kubernetes|k8s|orchestration|deployment)\\b", Pattern.CASE_INSENSITIVE),
                        "DEVOPS_TOOL",
                        "Kubernetes",
                        "ADVANCED",
                        false));

        // Version Control
        SKILL_PATTERNS.put(
                "GIT",
                new SkillPattern(
                        Pattern.compile("\\b(git|version|control|repository)\\b", Pattern.CASE_INSENSITIVE),
                        "VERSION_CONTROL",
                        "Git",
                        "INTERMEDIATE",
                        false));

        // Build Tools
        SKILL_PATTERNS.put(
                "MAVEN",
                new SkillPattern(
                        Pattern.compile("\\b(maven|build|dependency|pom)\\b", Pattern.CASE_INSENSITIVE),
                        "BUILD_TOOL",
                        "Maven",
                        "INTERMEDIATE",
                        false));
    }

    /**
     * Analyze requirement text and generate detailed skill requirements
     */
    public List<TaskRequiredSkillResponse> analyzeRequiredSkills(String requirementText, String taskType) {
        List<TaskRequiredSkillResponse> requiredSkills = new ArrayList<>();
        String text = requirementText.toLowerCase();

        log.info("Analyzing skills for requirement: {}", requirementText);

        // Analyze each skill pattern
        for (Map.Entry<String, SkillPattern> entry : SKILL_PATTERNS.entrySet()) {
            SkillPattern pattern = entry.getValue();

            if (pattern.getPattern().matcher(text).find()) {
                // Determine proficiency level based on context
                String proficiencyLevel = determineProficiencyLevel(text, entry.getKey(), pattern.getDefaultLevel());

                // Determine if mandatory based on task complexity and keywords
                boolean isMandatory = determineMandatory(text, pattern.isDefaultMandatory());

                // Calculate confidence score
                double confidence = calculateSkillConfidence(text, pattern.getPattern());

                // Generate reasoning
                String reasoning = generateSkillReasoning(requirementText, pattern.getSkillName());

                TaskRequiredSkillResponse skill = TaskRequiredSkillResponse.builder()
                        .skillType(pattern.getSkillType())
                        .requiredLevel(proficiencyLevel)
                        .skillName(pattern.getSkillName())
                        .mandatory(isMandatory)
                        .confidenceScore(confidence)
                        .reasoningNote(reasoning)
                        .build();

                requiredSkills.add(skill);
                log.info("Identified skill: {} with level: {}", pattern.getSkillName(), proficiencyLevel);
            }
        }

        // Add additional skills based on task complexity
        requiredSkills.addAll(inferAdditionalSkills(text, taskType));

        // Sort by importance (mandatory first, then by confidence)
        requiredSkills.sort((s1, s2) -> {
            if (s1.getMandatory() && !s2.getMandatory()) return -1;
            if (!s1.getMandatory() && s2.getMandatory()) return 1;
            return Double.compare(s2.getConfidenceScore(), s1.getConfidenceScore());
        });

        log.info("Generated {} skill requirements for task", requiredSkills.size());
        return requiredSkills;
    }

    private String determineProficiencyLevel(String text, String skillKey, String defaultLevel) {
        // Look for proficiency indicators in the text
        if (text.contains("expert") || text.contains("lead") || text.contains("senior") || text.contains("architect")) {
            return "EXPERT";
        }
        if (text.contains("advanced")
                || text.contains("complex")
                || text.contains("scalable")
                || text.contains("performance")) {
            return "ADVANCED";
        }
        if (text.contains("basic") || text.contains("simple") || text.contains("beginner")) {
            return "BEGINNER";
        }

        // Context-specific proficiency adjustments
        if (skillKey.equals("AUTHENTICATION") || skillKey.equals("SECURITY")) {
            return "ADVANCED"; // Security requires advanced knowledge
        }
        if (skillKey.equals("PERFORMANCE_OPTIMIZATION")) {
            return "ADVANCED"; // Performance optimization is advanced
        }

        return defaultLevel;
    }

    private boolean determineMandatory(String text, boolean defaultMandatory) {
        // Look for mandatory indicators
        if (text.contains("must") || text.contains("shall") || text.contains("required") || text.contains("critical")) {
            return true;
        }
        if (text.contains("should") || text.contains("preferred") || text.contains("optional")) {
            return false;
        }

        return defaultMandatory;
    }

    private double calculateSkillConfidence(String text, Pattern pattern) {
        // Count pattern matches to determine confidence
        long matchCount = pattern.matcher(text).results().count();

        if (matchCount >= 3) return 0.95;
        if (matchCount == 2) return 0.85;
        if (matchCount == 1) return 0.75;

        return 0.60; // Default confidence
    }

    private String generateSkillReasoning(String requirementText, String skillName) {
        if (requirementText.toLowerCase().contains("authentication") && skillName.contains("Authentication")) {
            return "Required for implementing user login and security features";
        }
        if (requirementText.toLowerCase().contains("crud") && skillName.contains("Backend")) {
            return "Essential for implementing create, read, update, delete operations";
        }
        if (requirementText.toLowerCase().contains("real-time") && skillName.contains("Real-time")) {
            return "Needed for implementing live notifications and real-time features";
        }
        if (requirementText.toLowerCase().contains("performance") && skillName.contains("Performance")) {
            return "Critical for meeting response time requirements";
        }
        if (requirementText.toLowerCase().contains("file") && skillName.contains("File")) {
            return "Required for implementing file upload and storage functionality";
        }

        return String.format(
                "Identified from requirement context: '%s'",
                requirementText.length() > 50 ? requirementText.substring(0, 50) + "..." : requirementText);
    }

    private List<TaskRequiredSkillResponse> inferAdditionalSkills(String text, String taskType) {
        List<TaskRequiredSkillResponse> additionalSkills = new ArrayList<>();

        // Always add communication skills for development tasks
        if (taskType != null && taskType.contains("DEVELOPMENT")) {
            additionalSkills.add(TaskRequiredSkillResponse.builder()
                    .skillType("SOFT_SKILL")
                    .requiredLevel("INTERMEDIATE")
                    .skillName("Technical Communication")
                    .mandatory(false)
                    .confidenceScore(0.70)
                    .reasoningNote("Essential for development collaboration and documentation")
                    .build());
        }

        // Add problem-solving skills for complex requirements
        if (text.contains("complex") || text.contains("multiple") || text.contains("integration")) {
            additionalSkills.add(TaskRequiredSkillResponse.builder()
                    .skillType("SOFT_SKILL")
                    .requiredLevel("ADVANCED")
                    .skillName("Complex Problem Solving")
                    .mandatory(false)
                    .confidenceScore(0.80)
                    .reasoningNote("Required for handling complex technical challenges")
                    .build());
        }

        return additionalSkills;
    }

    // Helper class to store skill pattern information
    @lombok.Data
    @lombok.AllArgsConstructor
    private static class SkillPattern {
        Pattern pattern;
        String skillType;
        String skillName;
        String defaultLevel;
        boolean defaultMandatory;
    }
}
