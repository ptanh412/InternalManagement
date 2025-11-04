package com.mnp.ai.service;

import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mnp.ai.dto.response.TaskRequiredSkillResponse;
import com.mnp.ai.entity.AnalyzedRequirement;
import com.mnp.ai.entity.GeneratedTask;
import com.mnp.ai.enums.RequirementPriority;
import com.mnp.ai.enums.RequirementType;
import com.mnp.ai.enums.TaskPriority;
import com.mnp.ai.enums.TaskType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class RequirementsAnalysisEngine {

    private final AISkillAnalysisService aiSkillAnalysisService;

    private static final Pattern FUNCTIONAL_KEYWORDS = Pattern.compile(
            "\\b(shall|must|should|will|user can|system shall|function|feature|capability)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern PERFORMANCE_KEYWORDS = Pattern.compile(
            "\\b(response time|performance|speed|throughput|latency|concurrent|load)\\b", Pattern.CASE_INSENSITIVE);

    private static final Pattern SECURITY_KEYWORDS = Pattern.compile(
            "\\b(security|authentication|authorization|encrypt|secure|protect|permission)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern UI_KEYWORDS = Pattern.compile(
            "\\b(interface|ui|ux|screen|page|form|button|menu|display|view)\\b", Pattern.CASE_INSENSITIVE);

    private static final Map<String, Double> SKILL_KEYWORDS = Map.of(
                    "Java", Pattern.compile("\\b(java|spring|hibernate|maven|gradle)\\b", Pattern.CASE_INSENSITIVE),
                    "JavaScript",
                            Pattern.compile("\\b(javascript|js|react|angular|vue|node)\\b", Pattern.CASE_INSENSITIVE),
                    "Python", Pattern.compile("\\b(python|django|flask|pandas|numpy)\\b", Pattern.CASE_INSENSITIVE),
                    "Database",
                            Pattern.compile(
                                    "\\b(database|sql|mysql|postgresql|mongodb|redis)\\b", Pattern.CASE_INSENSITIVE),
                    "Cloud", Pattern.compile("\\b(aws|azure|gcp|cloud|docker|kubernetes)\\b", Pattern.CASE_INSENSITIVE),
                    "API", Pattern.compile("\\b(api|rest|graphql|microservice|endpoint)\\b", Pattern.CASE_INSENSITIVE),
                    "Frontend",
                            Pattern.compile("\\b(frontend|ui|css|html|responsive|mobile)\\b", Pattern.CASE_INSENSITIVE),
                    "Backend",
                            Pattern.compile(
                                    "\\b(backend|server|service|integration|processing)\\b", Pattern.CASE_INSENSITIVE))
            .entrySet()
            .stream()
            .collect(Collectors.toMap(Map.Entry::getKey, entry -> {
                // This is a workaround - in real implementation, use proper skill detection
                return 3.0; // Default skill level
            }));

    /**
     * Analyze extracted text and break it down into individual requirements
     */
    public List<AnalyzedRequirement> analyzeRequirements(String extractedText, String documentId) {
        log.info("Starting requirements analysis for document: {}", documentId);

        List<String> rawRequirements = extractIndividualRequirements(extractedText);
        List<AnalyzedRequirement> analyzedRequirements = new ArrayList<>();

        for (String rawRequirement : rawRequirements) {
            if (rawRequirement.trim().length() < 10) continue; // Skip very short texts

            AnalyzedRequirement analyzed = analyzeIndividualRequirement(rawRequirement);
            analyzedRequirements.add(analyzed);
        }

        // Detect conflicts and dependencies
        detectConflictsAndDependencies(analyzedRequirements);

        log.info("Completed analysis of {} requirements for document: {}", analyzedRequirements.size(), documentId);

        return analyzedRequirements;
    }

    /**
     * Generate tasks from analyzed requirements with detailed skill analysis
     */
    public List<GeneratedTask> generateTasksFromRequirements(List<AnalyzedRequirement> requirements) {
        log.info("Generating tasks from {} requirements", requirements.size());

        List<GeneratedTask> generatedTasks = new ArrayList<>();

        for (AnalyzedRequirement requirement : requirements) {
            List<GeneratedTask> tasksForRequirement = generateTasksForRequirement(requirement);
            generatedTasks.addAll(tasksForRequirement);
        }

        // Sort by priority and dependencies
        sortTasksByPriorityAndDependencies(generatedTasks);

        log.info("Generated {} tasks from requirements", generatedTasks.size());
        return generatedTasks;
    }

    private List<String> extractIndividualRequirements(String text) {
        List<String> requirements = new ArrayList<>();

        // Clean up the text first
        text = text.replaceAll("===.*?===", "").trim(); // Remove file headers like "=== Car Booking App.docx ==="

        // Split by major sections (##, ###, numbered sections)
        String[] sections = text.split("(?=##\\s+)|(?=###\\s+)|(?=\\d+\\.\\d+\\s+)");

        for (String section : sections) {
            section = section.trim();

            // Skip empty sections, just headers, or very short content
            if (section.length() < 30 || section.matches("^#+\\s*$") || section.matches("^\\d+\\.?\\s*$")) {
                continue;
            }

            // Check if this is a functional requirement section
            if (isFunctionalRequirementSection(section)) {
                // For sections with bullet points, extract each as a separate requirement
                if (section.contains("-") && section.contains("\n")) {
                    List<String> bulletPoints = extractBulletPointRequirements(section);
                    requirements.addAll(bulletPoints);
                } else {
                    // Add the entire section as one requirement
                    requirements.add(cleanupRequirementText(section));
                }
            }
        }

        // If no structured requirements found, try to extract from paragraphs
        if (requirements.isEmpty()) {
            String[] paragraphs = text.split("\n\n+");
            for (String paragraph : paragraphs) {
                paragraph = paragraph.trim();
                if (paragraph.length() > 50 && containsMeaningfulContent(paragraph)) {
                    requirements.add(cleanupRequirementText(paragraph));
                }
            }
        }

        return requirements;
    }

    private boolean isFunctionalRequirementSection(String section) {
        String lowerSection = section.toLowerCase();

        // Check for functional requirement indicators
        return lowerSection.contains("user")
            || lowerSection.contains("system")
            || lowerSection.contains("application")
            || lowerSection.contains("booking")
            || lowerSection.contains("payment")
            || lowerSection.contains("search")
            || lowerSection.contains("management")
            || lowerSection.contains("registration")
            || lowerSection.contains("login")
            || lowerSection.contains("profile")
            || lowerSection.contains("notification")
            || lowerSection.contains("location")
            || lowerSection.contains("communication")
            || lowerSection.contains("feature")
            || lowerSection.contains("functionality")
            || section.contains("-") // bullet points likely contain requirements
            || FUNCTIONAL_KEYWORDS.matcher(section).find();
    }

    private List<String> extractBulletPointRequirements(String section) {
        List<String> bulletRequirements = new ArrayList<>();

        // Extract the section title
        String[] lines = section.split("\n");
        String sectionTitle = "";
        List<String> bulletPoints = new ArrayList<>();

        for (String line : lines) {
            line = line.trim();
            if (line.startsWith("-") || line.startsWith("•") || line.startsWith("*")) {
                // This is a bullet point
                String bulletText = line.replaceFirst("^[-•*]\\s*", "").trim();
                if (bulletText.length() > 10) {
                    bulletPoints.add(bulletText);
                }
            } else if (line.length() > 5 && !line.startsWith("#") && sectionTitle.isEmpty()) {
                // This might be the section title
                sectionTitle = line;
            }
        }

        // Combine section title with bullet points to create meaningful requirements
        for (String bullet : bulletPoints) {
            String fullRequirement = sectionTitle.isEmpty() ? bullet : sectionTitle + ": " + bullet;
            bulletRequirements.add(cleanupRequirementText(fullRequirement));
        }

        return bulletRequirements;
    }

    private boolean containsMeaningfulContent(String text) {
        String lowerText = text.toLowerCase();

        // Check if the text contains actual requirement content, not just formatting
        return !text.matches("^#+\\s*.*") // Not just a header
            && !text.matches("^\\d+\\.\\s*$") // Not just a number
            && (lowerText.contains("user")
                || lowerText.contains("system")
                || lowerText.contains("application")
                || lowerText.contains("shall")
                || lowerText.contains("must")
                || lowerText.contains("should")
                || lowerText.contains("will")
                || lowerText.contains("can")
                || FUNCTIONAL_KEYWORDS.matcher(text).find());
    }

    private String cleanupRequirementText(String text) {
        return text.replaceAll("#+\\s*", "") // Remove markdown headers
                  .replaceAll("\\s+", " ") // Normalize whitespace
                  .trim();
    }

    private AnalyzedRequirement analyzeIndividualRequirement(String requirementText) {
        return AnalyzedRequirement.builder()
                .originalContent(requirementText)
                .description(enhanceRequirementDescription(requirementText))
                .requirementType(determineRequirementType(requirementText))
                .priority(determinePriority(requirementText))
                .complexityScore(estimateComplexityScore(requirementText))
                .estimatedEffort(estimateHours(requirementText))
                .build();
    }

    private String enhanceRequirementDescription(String originalText) {
        StringBuilder enhanced = new StringBuilder(originalText);

        // Add context and clarifications
        if (originalText.toLowerCase().contains("user")
                && !originalText.toLowerCase().contains("role")) {
            enhanced.append(" [AI Note: Consider specifying user roles and personas]");
        }

        if (originalText.toLowerCase().contains("system")
                && !originalText.toLowerCase().contains("component")) {
            enhanced.append(" [AI Note: Consider breaking down into specific system components]");
        }

        return enhanced.toString();
    }

    private RequirementType determineRequirementType(String text) {
        text = text.toLowerCase();

        if (FUNCTIONAL_KEYWORDS.matcher(text).find()) return RequirementType.FUNCTIONAL;
        if (PERFORMANCE_KEYWORDS.matcher(text).find()) return RequirementType.PERFORMANCE;
        if (SECURITY_KEYWORDS.matcher(text).find()) return RequirementType.SECURITY;
        if (UI_KEYWORDS.matcher(text).find()) return RequirementType.USABILITY;
        if (text.contains("integrate") || text.contains("connect")) return RequirementType.TECHNICAL;
        if (text.contains("business") || text.contains("process")) return RequirementType.BUSINESS;
        if (text.contains("technical") || text.contains("architecture")) return RequirementType.TECHNICAL;

        return RequirementType.FUNCTIONAL; // Default
    }

    private RequirementPriority determinePriority(String text) {
        text = text.toLowerCase();

        if (text.contains("critical") || text.contains("must") || text.contains("essential")) {
            return RequirementPriority.CRITICAL;
        }
        if (text.contains("high") || text.contains("important") || text.contains("shall")) {
            return RequirementPriority.HIGH;
        }
        if (text.contains("should") || text.contains("preferred")) {
            return RequirementPriority.MEDIUM;
        }
        if (text.contains("could") || text.contains("optional") || text.contains("nice")) {
            return RequirementPriority.LOW;
        }

        return RequirementPriority.MEDIUM; // Default
    }

    private Integer estimateHours(String text) {
        Double complexityScore = estimateComplexityScore(text);

        return switch (complexityScore.intValue()) {
            case 1 -> 8; // LOW - 1 day
            case 2 -> 24; // MEDIUM - 3 days
            case 3 -> 40; // HIGH - 1 week
            case 4 -> 80; // EXPERT - 2 weeks
            default -> 16; // Default
        };
    }

    private Double estimateComplexityScore(String text) {
        int complexityScore = 0;
        text = text.toLowerCase();

        // Technical complexity indicators
        if (text.contains("integrate") || text.contains("api")) complexityScore += 2;
        if (text.contains("security") || text.contains("encrypt")) complexityScore += 2;
        if (text.contains("performance") || text.contains("scale")) complexityScore += 2;
        if (text.contains("complex") || text.contains("advanced")) complexityScore += 2;
        if (text.contains("multiple") || text.contains("various")) complexityScore += 1;

        // Length and detail indicators
        if (text.length() > 200) complexityScore += 1;
        if (text.split("and").length > 3) complexityScore += 1;

        return switch (complexityScore) {
            case 0, 1 -> 1.0; // LOW
            case 2, 3 -> 2.0; // MEDIUM
            case 4, 5 -> 3.0; // HIGH
            default -> 4.0; // EXPERT
        };
    }

    private void detectConflictsAndDependencies(List<AnalyzedRequirement> requirements) {
        // Simple conflict detection - in real implementation, use more sophisticated NLP
        for (int i = 0; i < requirements.size(); i++) {
            for (int j = i + 1; j < requirements.size(); j++) {
                AnalyzedRequirement req1 = requirements.get(i);
                AnalyzedRequirement req2 = requirements.get(j);

                if (detectConflict(req1.getOriginalContent(), req2.getOriginalContent())) {
                    // In a real MongoDB implementation, we'd update these fields if they existed
                    log.warn("Potential conflict detected between requirements");
                }
            }
        }
    }

    private boolean detectConflict(String req1, String req2) {
        // Simple conflict detection - look for contradictory statements
        req1 = req1.toLowerCase();
        req2 = req2.toLowerCase();

        // Example: one says "must" another says "must not"
        if ((req1.contains("must ") && req2.contains("must not"))
                || (req1.contains("shall ") && req2.contains("shall not"))
                || (req1.contains("required") && req2.contains("optional"))) {
            return true;
        }

        return false;
    }

    private List<GeneratedTask> generateTasksForRequirement(AnalyzedRequirement requirement) {
        List<GeneratedTask> tasks = new ArrayList<>();

        // Break down complex requirements into multiple tasks
        if (requirement.getComplexityScore() != null && requirement.getComplexityScore() >= 3.0) {
            tasks.addAll(breakDownIntoSubtasks(requirement));
        } else {
            tasks.add(createSingleTaskWithSkills(requirement));
        }

        return tasks;
    }

    private GeneratedTask createSingleTaskWithSkills(AnalyzedRequirement requirement) {
        String taskTitle = extractTitleFromRequirement(requirement.getOriginalContent());
        String taskDescription = requirement.getDescription();
        TaskType taskType = determineTaskType(requirement);

        // Generate detailed skill requirements using AI
        List<TaskRequiredSkillResponse> requiredSkills =
                aiSkillAnalysisService.analyzeRequiredSkills(requirement.getOriginalContent(), taskType.toString());

        return GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title(taskTitle)
                .description(taskDescription)
                .taskType(taskType)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(requiredSkills) // Now populated with detailed skill information
                .estimatedHours(requirement.getEstimatedEffort().doubleValue())
                .confidenceScore(0.75)
                .build();
    }

    private List<GeneratedTask> breakDownIntoSubtasks(AnalyzedRequirement requirement) {
        List<GeneratedTask> subtasks = new ArrayList<>();
        String baseTitle = extractTitleFromRequirement(requirement.getOriginalContent());

        // Analysis phase
        List<TaskRequiredSkillResponse> analysisSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Analysis and design for: " + requirement.getOriginalContent(), TaskType.RESEARCH.toString());

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Analysis: " + baseTitle)
                .description("Analyze and design solution for: " + requirement.getDescription())
                .taskType(TaskType.RESEARCH)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(analysisSkills)
                .estimatedHours(8.0)
                .confidenceScore(0.85)
                .build());

        // Implementation phase
        List<TaskRequiredSkillResponse> implementationSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                requirement.getOriginalContent(), TaskType.DEVELOPMENT.toString());

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Implement: " + baseTitle)
                .description("Implement the solution for: " + requirement.getDescription())
                .taskType(TaskType.DEVELOPMENT)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(implementationSkills)
                .estimatedHours((double) (requirement.getEstimatedEffort() - 16))
                .confidenceScore(0.80)
                .build());

        // Testing phase
        List<TaskRequiredSkillResponse> testingSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Testing for: " + requirement.getOriginalContent(), TaskType.TESTING.toString());

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Test: " + baseTitle)
                .description("Test and validate: " + requirement.getDescription())
                .taskType(TaskType.TESTING)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(testingSkills)
                .estimatedHours(8.0)
                .confidenceScore(0.75)
                .build());

        return subtasks;
    }

    private TaskType determineTaskType(AnalyzedRequirement requirement) {
        String content = requirement.getOriginalContent().toLowerCase();

        if (content.contains("test") || content.contains("verify") || content.contains("validate")) {
            return TaskType.TESTING;
        }
        if (content.contains("research") || content.contains("analyze") || content.contains("study")) {
            return TaskType.RESEARCH;
        }
        if (content.contains("document") || content.contains("spec") || content.contains("design")) {
            return TaskType.DOCUMENTATION;
        }

        return TaskType.DEVELOPMENT; // Default for most requirements
    }

    private String extractTitleFromRequirement(String requirement) {
        // Clean up the requirement text to create a concise title
        String title = requirement.trim();

        // Remove common prefixes
        title = title.replaceAll(
                "^(The\\s+system\\s+shall\\s+|Users?\\s+must\\s+be\\s+able\\s+to\\s+|The\\s+application\\s+should\\s+)",
                "");

        // Capitalize first letter
        if (!title.isEmpty()) {
            title = title.substring(0, 1).toUpperCase() + title.substring(1);
        }

        // Truncate if too long
        if (title.length() > 80) {
            title = title.substring(0, 77) + "...";
        }

        return title;
    }

    private TaskPriority mapPriority(RequirementPriority reqPriority) {
        if (reqPriority == null) return TaskPriority.MEDIUM;

        return switch (reqPriority) {
            case CRITICAL -> TaskPriority.CRITICAL;
            case HIGH -> TaskPriority.HIGH;
            case MEDIUM -> TaskPriority.MEDIUM;
            case LOW -> TaskPriority.LOW;
            case OPTIONAL -> null;
        };
    }

    private void sortTasksByPriorityAndDependencies(List<GeneratedTask> tasks) {
        tasks.sort((t1, t2) -> {
            // Sort by priority first
            int priorityComparison = comparePriority(t1.getPriority(), t2.getPriority());
            if (priorityComparison != 0) return priorityComparison;

            // Then by task type (Research -> Development -> Testing)
            return compareTaskType(t1.getTaskType(), t2.getTaskType());
        });
    }

    private int comparePriority(TaskPriority p1, TaskPriority p2) {
        Map<TaskPriority, Integer> priorityOrder = Map.of(
                TaskPriority.CRITICAL, 1,
                TaskPriority.HIGH, 2,
                TaskPriority.MEDIUM, 3,
                TaskPriority.LOW, 4);

        return Integer.compare(priorityOrder.getOrDefault(p1, 3), priorityOrder.getOrDefault(p2, 3));
    }

    private int compareTaskType(TaskType t1, TaskType t2) {
        Map<TaskType, Integer> typeOrder = Map.of(
                TaskType.RESEARCH, 1,
                TaskType.DEVELOPMENT, 2,
                TaskType.TESTING, 3,
                TaskType.DOCUMENTATION, 4);

        return Integer.compare(typeOrder.getOrDefault(t1, 2), typeOrder.getOrDefault(t2, 2));
    }
}
