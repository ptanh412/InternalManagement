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

/**
 * AI-powered requirements analysis engine that extracts, analyzes, and breaks down
 * project requirements into actionable tasks with skill recommendations
 */
@Service("requirementsAnalysisEngine")
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

        // If still no requirements found, intelligently break down the text into feature requirements
        if (requirements.isEmpty() && text.length() > 20) {
            requirements.addAll(intelligentlyParseSimpleText(text));
        }

        return requirements;
    }

    /**
     * Intelligently parse simple text input into multiple detailed requirements
     * For example: "create app booking to make app fast and help customer book car anytime"
     * Should generate multiple requirements for: performance optimization, booking functionality, accessibility, etc.
     */
    private List<String> intelligentlyParseSimpleText(String text) {
        List<String> extractedRequirements = new ArrayList<>();
        String lowerText = text.toLowerCase();

        // Extract project context
        String projectContext = extractProjectContext(text);

        // Detect key features and intents from the text
        List<String> detectedIntents = new ArrayList<>();

        // Performance-related requirements
        if (lowerText.contains("fast")
                || lowerText.contains("quickly")
                || lowerText.contains("smooth")
                || lowerText.contains("performance")) {
            detectedIntents.add("PERFORMANCE");
            extractedRequirements.add(projectContext
                    + ": Implement performance optimization to ensure fast response times and smooth user experience");
        }

        // Booking/Reservation functionality
        if (lowerText.contains("book")
                || lowerText.contains("reservation")
                || lowerText.contains("reserve")
                || lowerText.contains("schedule")) {
            detectedIntents.add("BOOKING");
            extractedRequirements.add(projectContext
                    + ": Develop booking/reservation functionality allowing users to make bookings easily");
        }

        // Accessibility requirements (anytime, anywhere)
        if (lowerText.contains("anytime")
                || lowerText.contains("anywhere")
                || lowerText.contains("24/7")
                || lowerText.contains("accessible")) {
            detectedIntents.add("ACCESSIBILITY");
            extractedRequirements.add(projectContext
                    + ": Ensure 24/7 accessibility with mobile-responsive design for access from anywhere");
        }

        // Car/Vehicle related
        if (lowerText.contains("car")
                || lowerText.contains("vehicle")
                || lowerText.contains("ride")
                || lowerText.contains("driver")) {
            detectedIntents.add("VEHICLE_MANAGEMENT");
            extractedRequirements.add(
                    projectContext + ": Implement vehicle/car management system with real-time availability tracking");
        }

        // Payment functionality
        if (lowerText.contains("payment") || lowerText.contains("pay") || lowerText.contains("checkout")) {
            detectedIntents.add("PAYMENT");
            extractedRequirements.add(
                    projectContext + ": Integrate secure payment processing system for booking transactions");
        }

        // User management
        if (lowerText.contains("customer") || lowerText.contains("user") || lowerText.contains("account")) {
            detectedIntents.add("USER_MANAGEMENT");
            extractedRequirements.add(
                    projectContext + ": Develop user account management with registration and profile features");
        }

        // Location/GPS features
        if (lowerText.contains("location")
                || lowerText.contains("gps")
                || lowerText.contains("map")
                || lowerText.contains("tracking")) {
            detectedIntents.add("LOCATION");
            extractedRequirements.add(
                    projectContext + ": Implement location-based services with GPS tracking and map integration");
        }

        // Notification system
        if (lowerText.contains("notification")
                || lowerText.contains("alert")
                || lowerText.contains("reminder")
                || lowerText.contains("notify")) {
            detectedIntents.add("NOTIFICATION");
            extractedRequirements.add(
                    projectContext + ": Create notification system for booking confirmations and status updates");
        }

        // If no specific intents detected, create generic requirements based on keywords
        if (extractedRequirements.isEmpty()) {
            extractedRequirements.add(projectContext + ": " + text);

            // Add common requirements for any application
            extractedRequirements.add(
                    projectContext + ": Implement core application functionality with user-friendly interface");
            extractedRequirements.add(projectContext + ": Ensure system reliability and data security");
        } else {
            // Add supporting requirements
            if (!detectedIntents.contains("USER_MANAGEMENT")
                    && (detectedIntents.contains("BOOKING") || detectedIntents.contains("PAYMENT"))) {
                extractedRequirements.add(projectContext + ": Implement user authentication and authorization system");
            }

            if (detectedIntents.contains("BOOKING") && !detectedIntents.contains("NOTIFICATION")) {
                extractedRequirements.add(
                        projectContext + ": Add booking confirmation and status notification features");
            }
        }

        return extractedRequirements;
    }

    /**
     * Extract project context from text
     */
    private String extractProjectContext(String text) {
        String lowerText = text.toLowerCase();

        // Try to identify project type
        if (lowerText.contains("booking") && lowerText.contains("car")) {
            return "Car Booking Application";
        } else if (lowerText.contains("booking") && lowerText.contains("hotel")) {
            return "Hotel Booking Application";
        } else if (lowerText.contains("booking")) {
            return "Booking Application";
        } else if (lowerText.contains("e-commerce") || lowerText.contains("shop")) {
            return "E-Commerce Application";
        } else if (lowerText.contains("management")) {
            return "Management System";
        } else {
            return "Application";
        }
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
        String requirementText = requirement.getOriginalContent().toLowerCase();

        // Determine the type of feature being built to create appropriate subtasks
        boolean isBookingFeature = requirementText.contains("booking") || requirementText.contains("reservation");
        boolean isPaymentFeature = requirementText.contains("payment") || requirementText.contains("transaction");
        boolean isUserFeature = requirementText.contains("user")
                || requirementText.contains("account")
                || requirementText.contains("profile");
        boolean isPerformanceFeature = requirementText.contains("performance")
                || requirementText.contains("fast")
                || requirementText.contains("optimiz");
        boolean isLocationFeature = requirementText.contains("location")
                || requirementText.contains("gps")
                || requirementText.contains("map");

        // 1. Analysis and Design Phase
        List<TaskRequiredSkillResponse> analysisSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Analysis and design for: " + requirement.getOriginalContent(), TaskType.RESEARCH.toString());

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Design & Architecture: " + baseTitle)
                .description("Create technical design, database schema, and API specifications for: "
                        + requirement.getDescription())
                .taskType(TaskType.RESEARCH)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(analysisSkills)
                .estimatedHours(8.0)
                .confidenceScore(0.85)
                .build());

        // 2. Backend Development Phase
        List<TaskRequiredSkillResponse> backendSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Backend development for: " + requirement.getOriginalContent(), TaskType.DEVELOPMENT.toString());

        String backendDescription =
                "Implement backend services, APIs, and business logic for: " + requirement.getDescription();
        if (isBookingFeature) {
            backendDescription = "Develop booking management API endpoints, validation logic, and database operations";
        } else if (isPaymentFeature) {
            backendDescription =
                    "Implement payment processing integration, transaction handling, and payment gateway APIs";
        } else if (isUserFeature) {
            backendDescription = "Build user authentication, authorization, and profile management APIs";
        } else if (isLocationFeature) {
            backendDescription = "Create location services API with GPS tracking and geocoding functionality";
        }

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Backend Development: " + baseTitle)
                .description(backendDescription)
                .taskType(TaskType.DEVELOPMENT)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(backendSkills)
                .estimatedHours(16.0)
                .confidenceScore(0.80)
                .build());

        // 3. Frontend Development Phase
        List<TaskRequiredSkillResponse> frontendSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Frontend development for: " + requirement.getOriginalContent(), TaskType.DEVELOPMENT.toString());

        String frontendDescription =
                "Create user interface components and integrate with backend APIs for: " + requirement.getDescription();
        if (isBookingFeature) {
            frontendDescription = "Develop booking form UI, availability calendar, and booking confirmation screens";
        } else if (isPaymentFeature) {
            frontendDescription = "Create payment interface, checkout flow, and payment status displays";
        } else if (isUserFeature) {
            frontendDescription = "Build user registration, login forms, and profile management interface";
        } else if (isLocationFeature) {
            frontendDescription = "Implement map visualization, location picker, and GPS tracking UI components";
        } else if (isPerformanceFeature) {
            frontendDescription = "Optimize frontend performance with lazy loading, caching, and efficient rendering";
        }

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Frontend Development: " + baseTitle)
                .description(frontendDescription)
                .taskType(TaskType.DEVELOPMENT)
                .priority(mapPriority(requirement.getPriority()))
                .requiredSkills(frontendSkills)
                .estimatedHours(12.0)
                .confidenceScore(0.80)
                .build());

        // 4. Integration & Testing Phase
        List<TaskRequiredSkillResponse> testingSkills = aiSkillAnalysisService.analyzeRequiredSkills(
                "Testing for: " + requirement.getOriginalContent(), TaskType.TESTING.toString());

        String testingDescription = "Perform unit testing, integration testing, and end-to-end testing for: "
                + requirement.getDescription();
        if (isPaymentFeature) {
            testingDescription =
                    "Conduct thorough testing including security testing, transaction verification, and payment flow validation";
        } else if (isPerformanceFeature) {
            testingDescription = "Execute performance testing, load testing, and optimization validation";
        }

        subtasks.add(GeneratedTask.builder()
                .analyzedRequirementId(requirement.getId())
                .title("Testing & Quality Assurance: " + baseTitle)
                .description(testingDescription)
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

        // Extract the core action and subject from the requirement
        // Pattern: "Project Context: Action + Object"
        if (title.contains(":")) {
            String[] parts = title.split(":", 2);
            if (parts.length == 2) {
                String context = parts[0].trim();
                String action = parts[1].trim();

                // Remove common prefixes to make title more concise
                action = action.replaceAll(
                        "^(Implement\\s+|Develop\\s+|Create\\s+|Add\\s+|Build\\s+|Ensure\\s+|Integrate\\s+)", "");

                // If action is already concise, use it; otherwise add context
                if (action.length() > 60) {
                    title = action;
                } else {
                    title = action;
                }
            }
        }

        // Remove common verbose prefixes
        title = title.replaceAll(
                "^(The\\s+system\\s+shall\\s+|Users?\\s+must\\s+be\\s+able\\s+to\\s+|The\\s+application\\s+should\\s+)",
                "");

        // Capitalize first letter
        if (!title.isEmpty()) {
            title = title.substring(0, 1).toUpperCase() + title.substring(1);
        }

        // Truncate if too long
        if (title.length() > 100) {
            title = title.substring(0, 97) + "...";
        }

        return title;
    }

    private TaskPriority mapPriority(RequirementPriority reqPriority) {
        if (reqPriority == null) return TaskPriority.MEDIUM;

        return switch (reqPriority) {
            case CRITICAL -> TaskPriority.URGENT; // Map CRITICAL to URGENT
            case HIGH -> TaskPriority.HIGH;
            case MEDIUM -> TaskPriority.MEDIUM;
            case LOW -> TaskPriority.LOW;
            case OPTIONAL -> TaskPriority.LOW; // Map OPTIONAL to LOW instead of null
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
                TaskPriority.URGENT, 1,
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
