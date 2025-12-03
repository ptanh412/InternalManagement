package com.mnp.ai.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mnp.ai.model.TaskProfile;
import com.mnp.ai.model.UserProfile;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class FeatureEngineeringService {

    // Related Skills Mapping
    private static final Map<String, List<String>> RELATED_SKILLS_MAP = Map.ofEntries(
        Map.entry("payment gateway integration", List.of(
            "database management", "restful api", "firebase",
            "transaction management", "sql", "mongodb", "backend development"
        )),
        Map.entry("transaction management", List.of(
            "database management", "sql", "postgresql", "mysql", "mongodb",
            "data synchronization", "state management"
        )),
        Map.entry("node.js", List.of(
            "javascript", "typescript", "express.js", "nestjs",
            "backend development", "restful api"
        )),
        Map.entry("restful api design", List.of(
            "restful api", "api development", "backend development",
            "microservices", "http", "swagger", "postman"
        )),
        Map.entry("react", List.of(
            "javascript", "typescript", "redux", "next.js",
            "vue", "angular", "frontend development"
        )),
        Map.entry("microservices", List.of(
            "docker", "kubernetes", "api gateway", "message queue",
            "rabbitmq", "kafka", "distributed systems"
        ))
    );

    // Technology Families
    private static final Map<String, List<String>> TECH_FAMILIES = Map.of(
        "payment_gateways", List.of("stripe", "paypal", "braintree", "square"),
        "javascript_frameworks", List.of("react", "vue", "angular", "svelte"),
        "backend_frameworks", List.of("express", "nestjs", "spring boot", "django"),
        "databases", List.of("postgresql", "mysql", "mongodb", "redis"),
        "cloud_platforms", List.of("aws", "azure", "gcp", "heroku")
    );

    /**
     * Calculate related skills score
     */
    public double calculateRelatedSkillsScore(List<String> requiredSkills, Map<String, Double> candidateSkills) {

        if (requiredSkills == null || candidateSkills == null) {
            return 0.0;
        }

        int totalRelatedMatches = 0;
        int totalPossibleRelated = 0;

        for (String required : requiredSkills) {
            String normalizedRequired = required.toLowerCase().trim();
            List<String> relatedSkills = RELATED_SKILLS_MAP.getOrDefault(normalizedRequired, List.of());

            if (relatedSkills.isEmpty()) continue;

            totalPossibleRelated += relatedSkills.size();

            for (String related : relatedSkills) {
                boolean hasRelated = candidateSkills.keySet().stream()
                    .anyMatch(skill -> skill.toLowerCase().contains(related.toLowerCase()));

                if (hasRelated) {
                    totalRelatedMatches++;
                }
            }
        }

        if (totalPossibleRelated == 0) return 0.0;

        double relatedRatio = (double) totalRelatedMatches / totalPossibleRelated;

        // Weight by number of related skills matched (max 0.3)
        return Math.min(0.3, relatedRatio * 0.5);
    }

    /**
     * Calculate learning potential score
     */
    public double calculateLearningPotential(
        List<String> requiredSkills,
        Map<String, Double> candidateSkills,
        String seniorityLevel
    ) {
        if (requiredSkills == null || candidateSkills == null) {
            return 0.0;
        }

        double learningScore = 0.0;

        // Parse seniority level to numeric
        int seniorityNum = parseSeniorityLevel(seniorityLevel);

        // Check if candidate has strong foundation skills
        double jsLevel = candidateSkills.getOrDefault("javascript", 0.0);
        double tsLevel = candidateSkills.getOrDefault("typescript", 0.0);
        boolean needsNodeJS = requiredSkills.stream()
            .anyMatch(s -> s.toLowerCase().contains("node"));
        double nodeLevel = candidateSkills.getOrDefault("node.js", 0.0);

        // Case 1: JavaScript expert can learn Node.js quickly
        if (jsLevel >= 4.0 && needsNodeJS && nodeLevel < 3.0) {
            learningScore += 0.15;
        }

        // Case 2: TypeScript knowledge helps with modern frameworks
        if (tsLevel >= 4.0 && nodeLevel > 0 && nodeLevel < 3.0) {
            learningScore += 0.10;
        }

        // Case 3: Has one payment gateway, can learn others
        boolean needsPaymentGateway = requiredSkills.stream()
            .anyMatch(s -> s.toLowerCase().contains("payment"));
        boolean hasAnyPaymentExp = candidateSkills.keySet().stream()
            .anyMatch(s -> TECH_FAMILIES.get("payment_gateways")
                .stream().anyMatch(pg -> s.toLowerCase().contains(pg)));

        if (needsPaymentGateway && hasAnyPaymentExp) {
            learningScore += 0.12;
        }

        // Case 4: Senior developers learn faster
        if (seniorityNum >= 4) {
            learningScore += 0.08;
        }

        // Case 5: Has multiple frameworks in same family
        long frameworkCount = candidateSkills.keySet().stream()
            .filter(s -> TECH_FAMILIES.get("javascript_frameworks")
                .stream().anyMatch(f -> s.toLowerCase().contains(f)))
            .count();

        if (frameworkCount >= 2) {
            learningScore += 0.10; // Flexible learner
        }

        return Math.min(0.35, learningScore); // Max 0.35
    }

    /**
     * Calculate domain experience bonus
     */
    public double calculateDomainExperienceBonus(
        String taskDescription,
        List<String> requiredSkills,
        Map<String, Double> candidateSkills
    ) {
        if (taskDescription == null || requiredSkills == null || candidateSkills == null) {
            return 0.0;
        }

        double domainScore = 0.0;
        String taskLower = taskDescription.toLowerCase();

        // E-commerce domain
        if (taskLower.contains("payment") || taskLower.contains("checkout") ||
            taskLower.contains("cart") || taskLower.contains("order")) {

            boolean hasEcommerceExp = candidateSkills.keySet().stream()
                .anyMatch(s -> s.toLowerCase().contains("stripe") ||
                              s.toLowerCase().contains("payment") ||
                              s.toLowerCase().contains("e-commerce"));

            if (hasEcommerceExp) domainScore += 0.15;
        }

        // Backend/API domain
        if (requiredSkills.stream().anyMatch(s ->
            s.toLowerCase().contains("api") || s.toLowerCase().contains("backend"))) {

            boolean hasBackendExp = candidateSkills.containsKey("backend development") ||
                candidateSkills.containsKey("restful api") ||
                candidateSkills.containsKey("microservices");

            if (hasBackendExp) domainScore += 0.12;
        }

        // Database-heavy tasks
        if (requiredSkills.stream().anyMatch(s ->
            s.toLowerCase().contains("database") || s.toLowerCase().contains("sql"))) {

            boolean hasDatabaseExp = candidateSkills.keySet().stream()
                .anyMatch(s -> TECH_FAMILIES.get("databases")
                    .stream().anyMatch(db -> s.toLowerCase().contains(db)));

            if (hasDatabaseExp) domainScore += 0.10;
        }

        // DevOps/Infrastructure
        if (taskLower.contains("deploy") || taskLower.contains("docker") ||
            taskLower.contains("kubernetes")) {

            boolean hasDevOpsExp = candidateSkills.containsKey("docker") ||
                candidateSkills.containsKey("kubernetes") ||
                candidateSkills.containsKey("ci/cd");

            if (hasDevOpsExp) domainScore += 0.12;
        }

        return Math.min(0.25, domainScore); // Max 0.25
    }

    /**
     * Calculate tech stack cohesion bonus
     */
    public double calculateTechStackCohesion(List<String> requiredSkills, Map<String, Double> candidateSkills) {
        if (requiredSkills == null || candidateSkills == null) {
            return 0.0;
        }

        double cohesionScore = 0.0;

        // MERN Stack (MongoDB, Express, React, Node.js)
        boolean needsMERN = requiredSkills.stream()
            .anyMatch(s -> s.toLowerCase().contains("node") ||
                          s.toLowerCase().contains("react") ||
                          s.toLowerCase().contains("express"));

        if (needsMERN) {
            int mernCount = 0;
            if (candidateSkills.containsKey("mongodb")) mernCount++;
            if (candidateSkills.containsKey("express.js") || candidateSkills.containsKey("express")) mernCount++;
            if (candidateSkills.containsKey("react")) mernCount++;
            if (candidateSkills.containsKey("node.js")) mernCount++;

            if (mernCount >= 3) cohesionScore += 0.20;
            else if (mernCount == 2) cohesionScore += 0.10;
        }

        // Full Stack combination
        boolean hasFrontend = candidateSkills.keySet().stream()
            .anyMatch(s -> s.toLowerCase().contains("react") ||
                          s.toLowerCase().contains("vue") ||
                          s.toLowerCase().contains("angular"));

        boolean hasBackend = candidateSkills.keySet().stream()
            .anyMatch(s -> s.toLowerCase().contains("node") ||
                          s.toLowerCase().contains("express") ||
                          s.toLowerCase().contains("spring"));

        boolean hasDatabase = candidateSkills.keySet().stream()
            .anyMatch(s -> s.toLowerCase().contains("sql") ||
                          s.toLowerCase().contains("mongo") ||
                          s.toLowerCase().contains("postgres"));

        if (hasFrontend && hasBackend && hasDatabase) {
            cohesionScore += 0.15; // Complete full-stack
        }

        return Math.min(0.25, cohesionScore); // Max 0.25
    }

    /**
     * Calculate AI-engineered scores for a candidate
     * Returns only the AI-calculated scores, not full CandidateFeatures
     * ML service will fetch user data directly from databases
     */
    public Map<String, Double> calculateAIScores(UserProfile candidate, TaskProfile task, double baseSkillMatch) {
        Map<String, Double> candidateSkills = candidate.getSkills();
        List<String> requiredSkills = task.getRequiredSkills() != null ?
            new ArrayList<>(task.getRequiredSkills().keySet()) : List.of();

        // Calculate only AI-specific scores
        // ML service will fetch performance, workload, etc. directly from databases
        return Map.of(
            "baseSkillMatchScore", baseSkillMatch,
            "relatedSkillsScore", calculateRelatedSkillsScore(requiredSkills, candidateSkills),
            "learningPotentialScore", calculateLearningPotential(requiredSkills, candidateSkills, candidate.getSeniorityLevel()),
            "domainExperienceBonus", calculateDomainExperienceBonus(
                task.getDescription() != null ? task.getDescription() : "",
                requiredSkills, candidateSkills),
            "techStackCohesionBonus", calculateTechStackCohesion(requiredSkills, candidateSkills),
            "certificationBonus", 0.0
        );
    }

    /**
     * Parse seniority level string to numeric value
     */
    private int parseSeniorityLevel(String seniorityLevel) {
        if (seniorityLevel == null) return 2;

        switch (seniorityLevel.toUpperCase()) {
            case "INTERN":
                return 1;
            case "JUNIOR":
                return 2;
            case "MID_LEVEL":
            case "MIDLEVEL":
            case "MID LEVEL":
                return 3;
            case "SENIOR":
                return 4;
            case "LEAD":
                return 5;
            case "PRINCIPAL":
                return 6;
            case "DIRECTOR":
                return 7;
            default:
                // Try to parse as number
                try {
                    return Integer.parseInt(seniorityLevel);
                } catch (NumberFormatException e) {
                    return 2; // Default to mid-level
                }
        }
    }
}


