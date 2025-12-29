package com.mnp.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced Skill Normalizer with semantic matching support and AI-powered fallback
 */
@Slf4j
@Component
public class SkillNormalizer {

    // ==================== SKILL SYNONYMS (Exact Match) ====================
    private static final Map<String, String> SKILL_SYNONYMS = new HashMap<>();

    // ==================== SEMANTIC RELATIONSHIPS (Can Learn / Transfer) ====================
    private static final Map<String, Set<String>> SEMANTIC_RELATIONSHIPS = new HashMap<>();

    // ==================== SKILL LEARNING DIFFICULTY (How easy to transfer) ====================
    private static final Map<String, Map<String, Double>> LEARNING_DIFFICULTY = new HashMap<>();

    static {
        initializeSynonyms();
        initializeSemanticRelationships();
        initializeLearningDifficulty();
    }

    private static void initializeSynonyms() {
        // Programming Languages
        SKILL_SYNONYMS.put("js", "javascript");
        SKILL_SYNONYMS.put("javascript (es6+)", "javascript");
        SKILL_SYNONYMS.put("es6", "javascript");
        SKILL_SYNONYMS.put("ts", "typescript");
        SKILL_SYNONYMS.put("py", "python");
        SKILL_SYNONYMS.put("python3", "python");

        // APIs
        SKILL_SYNONYMS.put("rest api", "restful api");
        SKILL_SYNONYMS.put("restful apis", "restful api");
        SKILL_SYNONYMS.put("restful api integration", "restful api");
        SKILL_SYNONYMS.put("restful api design", "restful api");
        SKILL_SYNONYMS.put("rest api design", "restful api");
        SKILL_SYNONYMS.put("api development", "restful api");
        SKILL_SYNONYMS.put("web api", "restful api");
        SKILL_SYNONYMS.put("http api", "restful api");

        // Frameworks - Java
        SKILL_SYNONYMS.put("spring", "spring boot");
        SKILL_SYNONYMS.put("spring framework", "spring boot");
        SKILL_SYNONYMS.put("java spring boot", "spring boot");
        SKILL_SYNONYMS.put("springboot", "spring boot");

        // Frameworks - JavaScript
        SKILL_SYNONYMS.put("react.js", "react");
        SKILL_SYNONYMS.put("reactjs", "react");
        SKILL_SYNONYMS.put("vue.js", "vue");
        SKILL_SYNONYMS.put("vuejs", "vue");
        SKILL_SYNONYMS.put("angular.js", "angular");
        SKILL_SYNONYMS.put("angularjs", "angular");
        SKILL_SYNONYMS.put("next", "next.js");
        SKILL_SYNONYMS.put("nextjs", "next.js");

        // Databases
        SKILL_SYNONYMS.put("postgres", "postgresql");
        SKILL_SYNONYMS.put("psql", "postgresql");
        SKILL_SYNONYMS.put("mysql server", "mysql");
        SKILL_SYNONYMS.put("mongo", "mongodb");
        SKILL_SYNONYMS.put("nosql", "mongodb");
        SKILL_SYNONYMS.put("database management", "database");
        SKILL_SYNONYMS.put("db", "database");

        // Cloud & DevOps
        SKILL_SYNONYMS.put("k8s", "kubernetes");
        SKILL_SYNONYMS.put("docker compose", "docker");
        SKILL_SYNONYMS.put("gcp", "google cloud platform");
        SKILL_SYNONYMS.put("aws", "amazon web services");
        SKILL_SYNONYMS.put("azure", "microsoft azure");
        SKILL_SYNONYMS.put("ci/cd pipeline", "ci/cd");
        SKILL_SYNONYMS.put("continuous integration", "ci/cd");

        // ML/AI
        SKILL_SYNONYMS.put("ml", "machine learning");
        SKILL_SYNONYMS.put("ai", "artificial intelligence");
        SKILL_SYNONYMS.put("deep learning", "machine learning");
        SKILL_SYNONYMS.put("dl", "deep learning");

        // Testing
        SKILL_SYNONYMS.put("integration testing", "testing");
        SKILL_SYNONYMS.put("load testing", "performance testing");
        SKILL_SYNONYMS.put("automation testing", "testing");
        SKILL_SYNONYMS.put("api testing", "testing");
        SKILL_SYNONYMS.put("test automation", "automation testing");
        SKILL_SYNONYMS.put("load testing methodologies", "load testing");

        // Mobile - Broader synonyms for mobile UI development
        SKILL_SYNONYMS.put("ios development", "mobile development");
        SKILL_SYNONYMS.put("android development", "mobile development");
        SKILL_SYNONYMS.put("mobile app development", "mobile development");
        SKILL_SYNONYMS.put("mobile application development", "mobile development");

        // Mobile UI Development is a synonym for mobile development
        SKILL_SYNONYMS.put("mobile ui development", "mobile development");
        SKILL_SYNONYMS.put("mobile ui design principles", "mobile ui design");
        SKILL_SYNONYMS.put("mobile interface development", "mobile development");
        SKILL_SYNONYMS.put("mobile app ui", "mobile development");

        // RESTful API Integration - common across all platforms
        SKILL_SYNONYMS.put("api integration", "restful api integration");
        SKILL_SYNONYMS.put("rest integration", "restful api integration");
        SKILL_SYNONYMS.put("http api integration", "restful api integration");

        // Design
        SKILL_SYNONYMS.put("ui design", "design");
        SKILL_SYNONYMS.put("ux design", "design");
        SKILL_SYNONYMS.put("ui/ux design", "design");
        SKILL_SYNONYMS.put("ui/ux", "design");
        SKILL_SYNONYMS.put("user research", "design");

        // Security
        SKILL_SYNONYMS.put("security principles", "security");
        SKILL_SYNONYMS.put("banking security", "security");
        SKILL_SYNONYMS.put("application security", "security");
        SKILL_SYNONYMS.put("cybersecurity", "security");

        // Performance
        SKILL_SYNONYMS.put("performance tuning", "performance optimization");
        SKILL_SYNONYMS.put("database optimization", "query optimization");
        SKILL_SYNONYMS.put("api performance tuning", "performance optimization");

        // State Management
        SKILL_SYNONYMS.put("state management (redux)", "redux");
        SKILL_SYNONYMS.put("state management", "redux");

        // Payment
        SKILL_SYNONYMS.put("payment gateway integration (stripe)", "stripe");
        SKILL_SYNONYMS.put("payment gateway integration", "payment gateway");
        SKILL_SYNONYMS.put("stripe api", "stripe");

        // Other
        SKILL_SYNONYMS.put("html/css", "html");
        SKILL_SYNONYMS.put("css3", "css");
        SKILL_SYNONYMS.put("html5", "html");
    }

    private static void initializeSemanticRelationships() {
        // ==================== JAVASCRIPT ECOSYSTEM ====================
        addBidirectionalRelationship("javascript", Arrays.asList(
                "typescript", "node.js", "react", "vue", "angular",
                "next.js", "express.js", "nestjs", "react native",
                "jest", "mocha", "webpack", "babel"
        ));

        addBidirectionalRelationship("typescript", Arrays.asList(
                "javascript", "angular", "react", "vue", "node.js",
                "nestjs", "next.js"
        ));

        // ==================== FRONTEND FRAMEWORKS (High Transferability) ====================
        // React developers can learn Vue/Angular
        addBidirectionalRelationship("react", Arrays.asList(
                "vue", "angular", "javascript", "typescript",
                "next.js", "redux", "jsx", "hooks",
                "react native", "state management"
        ));

        addBidirectionalRelationship("vue", Arrays.asList(
                "react", "angular", "javascript", "typescript",
                "nuxt.js", "vuex", "vue.js"
        ));

        addBidirectionalRelationship("angular", Arrays.asList(
                "react", "vue", "typescript", "javascript",
                "rxjs", "ngrx"
        ));

        // ==================== MOBILE DEVELOPMENT ====================
        // All mobile technologies share: mobile UI, API integration, mobile UX patterns
        // ANY mobile framework developer can work on mobile tasks with proper skill matching

        addBidirectionalRelationship("react native", Arrays.asList(
                "react", "javascript", "typescript",
                "mobile development", "ios", "android",
                "flutter", "swift", "kotlin",
                "mobile ui design", "mobile ui development",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "mobile app ui",
                "ui/ux", "responsive design"
        ));

        addBidirectionalRelationship("flutter", Arrays.asList(
                "dart", "react native", "mobile development",
                "ios", "android", "swift", "kotlin",
                "mobile ui design", "mobile ui development",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "mobile app ui",
                "ui/ux", "responsive design"
        ));

        addBidirectionalRelationship("android", Arrays.asList(
                "kotlin", "java", "mobile development",
                "mobile ui design", "mobile ui development",
                "flutter", "react native", "ios", "swift",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "mobile app ui",
                "xml layouts", "material design"
        ));

        addBidirectionalRelationship("ios", Arrays.asList(
                "swift", "mobile development", "objective-c",
                "mobile ui design", "mobile ui development",
                "flutter", "react native", "android", "kotlin",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "mobile app ui",
                "storyboards", "uikit", "swiftui"
        ));

        addBidirectionalRelationship("swift", Arrays.asList(
                "ios", "mobile development", "objective-c",
                "mobile ui design", "mobile ui development",
                "flutter", "react native", "android", "kotlin",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "mobile app ui",
                "swiftui", "uikit"
        ));

        addBidirectionalRelationship("kotlin", Arrays.asList(
                "android", "java", "mobile development",
                "mobile ui design", "mobile ui development",
                "flutter", "react native", "ios", "swift",
                "restful api integration", "restful api", "api integration",
                "mobile app development", "jetpack compose"
        ));

        // Mobile UI Development - CRITICAL skill for all mobile frameworks
        // If someone knows mobile UI, they understand mobile patterns
        addBidirectionalRelationship("mobile ui development", Arrays.asList(
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "mobile development", "mobile ui design", "mobile app development",
                "ui/ux", "responsive design", "mobile patterns",
                "restful api integration", "restful api"
        ));

        // Mobile Development (general) - UMBRELLA term covering all mobile tech
        addBidirectionalRelationship("mobile development", Arrays.asList(
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "mobile ui development", "mobile ui design",
                "restful api integration", "restful api", "mobile app development",
                "mobile patterns", "app store", "play store"
        ));

        // RESTful API Integration - UNIVERSAL skill across ALL platforms
        // Backend, Frontend, Mobile all use RESTful APIs
        addBidirectionalRelationship("restful api integration", Arrays.asList(
                "restful api", "api integration", "http",
                "json", "axios", "fetch", "retrofit",
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "javascript", "typescript", "java", "python",
                "mobile development", "backend development", "frontend development"
        ));

        addBidirectionalRelationship("restful api", Arrays.asList(
                "restful api integration", "api integration",
                "http", "rest", "json", "api design",
                "react native", "flutter", "ios", "android",
                "mobile development", "backend development"
        ));

        // ==================== JAVA ECOSYSTEM ====================
        addBidirectionalRelationship("java", Arrays.asList(
                "spring boot", "spring", "hibernate", "jpa",
                "maven", "gradle", "junit", "spring security",
                "kotlin", "microservices"
        ));

        addBidirectionalRelationship("spring boot", Arrays.asList(
                "java", "spring", "hibernate", "jpa",
                "spring security", "microservices", "restful api"
        ));

        // ==================== PYTHON ECOSYSTEM ====================
        addBidirectionalRelationship("python", Arrays.asList(
                "django", "flask", "fastapi",
                "machine learning", "tensorflow", "pytorch",
                "pandas", "numpy", "scikit-learn",
                "nlp", "data analysis", "etl"
        ));

        addBidirectionalRelationship("machine learning", Arrays.asList(
                "python", "tensorflow", "pytorch", "scikit-learn",
                "deep learning", "nlp", "keras",
                "data analysis", "ai"
        ));

        addBidirectionalRelationship("tensorflow", Arrays.asList(
                "python", "machine learning", "keras",
                "pytorch", "deep learning", "nlp"
        ));

        // ==================== NODE.JS BACKEND ====================
        addBidirectionalRelationship("node.js", Arrays.asList(
                "javascript", "typescript", "express.js", "nestjs",
                "restful api", "microservices", "mongodb",
                "websocket", "backend development"
        ));

        addBidirectionalRelationship("express.js", Arrays.asList(
                "node.js", "javascript", "typescript",
                "restful api", "nestjs", "backend development"
        ));

        addBidirectionalRelationship("nestjs", Arrays.asList(
                "node.js", "typescript", "express.js",
                "restful api", "microservices", "backend development"
        ));

        // ==================== DATABASES (SQL - High Transferability) ====================
        addBidirectionalRelationship("postgresql", Arrays.asList(
                "mysql", "sql", "database", "query optimization",
                "database design", "sql server", "oracle"
        ));

        addBidirectionalRelationship("mysql", Arrays.asList(
                "postgresql", "sql", "database", "query optimization",
                "database design", "mariadb"
        ));

        addBidirectionalRelationship("mongodb", Arrays.asList(
                "nosql", "database", "node.js", "express.js",
                "backend development", "database design"
        ));

        // ==================== RESTFUL API & BACKEND ====================
        addBidirectionalRelationship("restful api", Arrays.asList(
                "api development", "restful api design", "restful api integration",
                "spring boot", "node.js", "express.js",
                "microservices", "backend development",
                "postman", "swagger", "api testing",
                // Mobile developers also work with APIs extensively
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "mobile development"
        ));

        addBidirectionalRelationship("restful api integration", Arrays.asList(
                "restful api", "api integration", "api development",
                "spring boot", "node.js", "express.js",
                "backend development",
                // All mobile frameworks require API integration
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "mobile development", "mobile app development"
        ));

        addBidirectionalRelationship("api integration", Arrays.asList(
                "restful api integration", "restful api", "api development",
                "backend development",
                // Mobile developers do API integration daily
                "react native", "flutter", "ios", "android", "swift", "kotlin",
                "mobile development"
        ));

        addBidirectionalRelationship("api performance tuning", Arrays.asList(
                "restful api", "spring boot", "node.js",
                "query optimization", "caching", "redis",
                "performance optimization", "backend development"
        ));

        // ==================== TESTING ====================
        addBidirectionalRelationship("junit", Arrays.asList(
                "java", "testing", "spring boot", "mockito",
                "integration testing", "automation testing"
        ));

        addBidirectionalRelationship("jest", Arrays.asList(
                "javascript", "typescript", "react", "node.js",
                "testing", "integration testing"
        ));

        addBidirectionalRelationship("jmeter", Arrays.asList(
                "load testing", "performance testing", "api testing",
                "gatling", "postman"
        ));

        addBidirectionalRelationship("selenium", Arrays.asList(
                "automation testing", "java", "python",
                "testing", "integration testing"
        ));

        addBidirectionalRelationship("postman", Arrays.asList(
                "api testing", "restful api", "testing",
                "swagger", "api development"
        ));

        // ==================== DEVOPS & CLOUD ====================
        addBidirectionalRelationship("docker", Arrays.asList(
                "kubernetes", "containerization", "devops",
                "ci/cd", "microservices"
        ));

        addBidirectionalRelationship("kubernetes", Arrays.asList(
                "docker", "devops", "microservices",
                "cloud architecture", "helm"
        ));

        addBidirectionalRelationship("ci/cd", Arrays.asList(
                "jenkins", "gitlab ci", "github actions",
                "docker", "kubernetes", "devops"
        ));

        // ==================== PAYMENT & INTEGRATION ====================
        addBidirectionalRelationship("stripe", Arrays.asList(
                "payment gateway", "webhook", "api integration",
                "backend development", "transaction management"
        ));

        addBidirectionalRelationship("transaction management", Arrays.asList(
                "database", "spring boot", "jpa", "hibernate",
                "payment gateway", "backend development"
        ));

        // ==================== STATE MANAGEMENT ====================
        addBidirectionalRelationship("redux", Arrays.asList(
                "react", "javascript", "typescript",
                "state management", "mobx", "zustand"
        ));

        // ==================== ARCHITECTURE ====================
        addBidirectionalRelationship("microservices", Arrays.asList(
                "spring boot", "docker", "kubernetes",
                "restful api", "message queue", "backend development"
        ));

        addBidirectionalRelationship("system architecture", Arrays.asList(
                "microservices", "cloud architecture",
                "backend architecture", "distributed systems"
        ));

        // ==================== SECURITY ====================
        addBidirectionalRelationship("jwt", Arrays.asList(
                "security", "authentication", "spring security",
                "oauth", "api security"
        ));

        addBidirectionalRelationship("spring security", Arrays.asList(
                "java", "spring boot", "security",
                "jwt", "oauth", "authentication"
        ));

        // ==================== UI/UX DESIGN ====================
        addBidirectionalRelationship("figma", Arrays.asList(
                "design", "ui design", "ux design",
                "prototyping", "mobile ui design", "user research"
        ));

        addBidirectionalRelationship("mobile ui design", Arrays.asList(
                "figma", "design", "mobile development",
                "react native", "flutter", "user research"
        ));
    }

    private static void initializeLearningDifficulty() {
        // Format: skill -> Map<related_skill, difficulty_score>
        // Score: 0.0 (very easy) to 1.0 (very hard)

        // Frontend frameworks (easy to transfer between)
        addLearningPath("react", "vue", 0.2);
        addLearningPath("react", "angular", 0.3);
        addLearningPath("vue", "react", 0.2);
        addLearningPath("vue", "angular", 0.3);
        addLearningPath("angular", "react", 0.3);
        addLearningPath("angular", "vue", 0.3);

        // JavaScript to TypeScript (easy)
        addLearningPath("javascript", "typescript", 0.1);
        addLearningPath("typescript", "javascript", 0.0);

        // SQL databases (very easy to transfer)
        addLearningPath("postgresql", "mysql", 0.1);
        addLearningPath("mysql", "postgresql", 0.1);
        addLearningPath("sql", "postgresql", 0.1);
        addLearningPath("sql", "mysql", 0.1);

        // Backend frameworks
        addLearningPath("express.js", "nestjs", 0.2);
        addLearningPath("nestjs", "express.js", 0.1);
        addLearningPath("node.js", "express.js", 0.1);
        addLearningPath("node.js", "nestjs", 0.2);

        // Mobile development - Frontend to Mobile transitions
        addLearningPath("react", "react native", 0.2);
        addLearningPath("react native", "flutter", 0.4);
        addLearningPath("android", "flutter", 0.3);
        addLearningPath("ios", "flutter", 0.3);

        // Mobile framework transfers - ALL mobile devs can do mobile UI/UX
        // iOS/Swift developers -> Other mobile frameworks
        addLearningPath("ios", "react native", 0.25);  // Easy: mobile concepts transfer
        addLearningPath("ios", "flutter", 0.3);
        addLearningPath("ios", "mobile ui development", 0.05);  // Very easy: already know iOS UI
        addLearningPath("ios", "mobile development", 0.0);  // Perfect: iOS IS mobile dev
        addLearningPath("ios", "mobile app development", 0.0);

        addLearningPath("swift", "react native", 0.25);
        addLearningPath("swift", "flutter", 0.3);
        addLearningPath("swift", "mobile ui development", 0.05);
        addLearningPath("swift", "mobile development", 0.0);  // Perfect: Swift IS mobile dev
        addLearningPath("swift", "mobile app development", 0.0);
        addLearningPath("swift", "ios", 0.0);  // Swift IS iOS

        // Android/Kotlin developers -> Other mobile frameworks
        addLearningPath("android", "react native", 0.25);
        addLearningPath("android", "flutter", 0.3);
        addLearningPath("android", "mobile ui development", 0.05);
        addLearningPath("android", "mobile development", 0.0);  // Perfect: Android IS mobile dev
        addLearningPath("android", "mobile app development", 0.0);

        addLearningPath("kotlin", "react native", 0.25);
        addLearningPath("kotlin", "flutter", 0.3);
        addLearningPath("kotlin", "mobile ui development", 0.05);
        addLearningPath("kotlin", "mobile development", 0.0);  // Perfect: Kotlin IS mobile dev
        addLearningPath("kotlin", "mobile app development", 0.0);
        addLearningPath("kotlin", "android", 0.0);  // Kotlin IS Android

        // Flutter developers -> Other mobile frameworks
        addLearningPath("flutter", "react native", 0.3);
        addLearningPath("flutter", "ios", 0.3);
        addLearningPath("flutter", "android", 0.3);
        addLearningPath("flutter", "mobile ui development", 0.05);
        addLearningPath("flutter", "mobile development", 0.0);  // Perfect: Flutter IS mobile dev
        addLearningPath("flutter", "mobile app development", 0.0);

        // React Native developers -> Other mobile frameworks
        addLearningPath("react native", "flutter", 0.3);
        addLearningPath("react native", "ios", 0.3);
        addLearningPath("react native", "android", 0.3);
        addLearningPath("react native", "mobile ui development", 0.05);
        addLearningPath("react native", "mobile development", 0.0);  // Perfect: RN IS mobile dev
        addLearningPath("react native", "mobile app development", 0.0);

        // API integration for mobile developers (CRITICAL: all mobile devs use APIs)
        addLearningPath("react native", "restful api integration", 0.05);  // Very easy: already using
        addLearningPath("react native", "restful api", 0.05);
        addLearningPath("flutter", "restful api integration", 0.05);
        addLearningPath("flutter", "restful api", 0.05);
        addLearningPath("ios", "restful api integration", 0.05);
        addLearningPath("ios", "restful api", 0.05);
        addLearningPath("swift", "restful api integration", 0.05);
        addLearningPath("swift", "restful api", 0.05);
        addLearningPath("android", "restful api integration", 0.05);
        addLearningPath("android", "restful api", 0.05);
        addLearningPath("kotlin", "restful api integration", 0.05);
        addLearningPath("kotlin", "restful api", 0.05);
        addLearningPath("mobile development", "restful api integration", 0.05);
        addLearningPath("mobile development", "restful api", 0.05);

        // Testing frameworks
        addLearningPath("junit", "mockito", 0.1);
        addLearningPath("jest", "mocha", 0.1);
        addLearningPath("selenium", "cypress", 0.2);

        // Java ecosystem
        addLearningPath("java", "spring boot", 0.3);
        addLearningPath("spring", "spring boot", 0.1);
        addLearningPath("java", "kotlin", 0.2);
    }

    private static void addBidirectionalRelationship(String skill, List<String> relatedSkills) {
        SEMANTIC_RELATIONSHIPS.putIfAbsent(skill, new HashSet<>());
        SEMANTIC_RELATIONSHIPS.get(skill).addAll(relatedSkills);
    }

    private static void addLearningPath(String from, String to, double difficulty) {
        LEARNING_DIFFICULTY.putIfAbsent(from, new HashMap<>());
        LEARNING_DIFFICULTY.get(from).put(to, difficulty);
    }

    // ==================== PUBLIC API ====================

    public String normalizeSkill(String skill) {
        if (skill == null || skill.trim().isEmpty()) return "";
        String key = skill.toLowerCase().trim();
        return SKILL_SYNONYMS.getOrDefault(key, key);
    }

    public Set<String> normalizeSkills(Set<String> skills) {
        if (skills == null) return Collections.emptySet();
        return skills.stream()
                .map(this::normalizeSkill)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * Calculate normalized exact match ratio
     */
    public double calculateNormalizedMatch(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return 1.0;
        if (userSkills == null || userSkills.isEmpty()) return 0.0;

        Set<String> u = normalizeSkills(userSkills);
        Set<String> r = normalizeSkills(requiredSkills);

        long matched = r.stream().filter(u::contains).count();
        return (double) matched / r.size();
    }

    /**
     * Calculate semantic match with learning potential
     * This is the key intelligent matching method
     */
    public Map<String, SkillMatchResult> calculateSemanticMatch(
            Set<String> userSkills,
            Set<String> requiredSkills) {

        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return Collections.emptyMap();
        }
        if (userSkills == null || userSkills.isEmpty()) {
            return requiredSkills.stream()
                    .collect(Collectors.toMap(
                            skill -> skill,
                            skill -> new SkillMatchResult(0.0, MatchType.NO_MATCH, null, null)
                    ));
        }

        Set<String> normalizedUserSkills = normalizeSkills(userSkills);
        Map<String, SkillMatchResult> results = new HashMap<>();

        for (String requiredSkill : requiredSkills) {
            String normalizedRequired = normalizeSkill(requiredSkill);

            // 1. EXACT MATCH (100%)
            if (normalizedUserSkills.contains(normalizedRequired)) {
                results.put(requiredSkill, new SkillMatchResult(
                        1.0, MatchType.EXACT, normalizedRequired, "Perfect match"));
                continue;
            }

            // 2. PARTIAL/SUBSTRING MATCH (70-80%)
            String partialMatch = normalizedUserSkills.stream()
                    .filter(userSkill ->
                            userSkill.contains(normalizedRequired) ||
                                    normalizedRequired.contains(userSkill))
                    .findFirst()
                    .orElse(null);

            if (partialMatch != null) {
                results.put(requiredSkill, new SkillMatchResult(
                        0.75, MatchType.PARTIAL, partialMatch,
                        "Closely related skill"));
                continue;
            }

            // 3. SEMANTIC RELATIONSHIP WITH LEARNING DIFFICULTY (40-60%)
            SemanticMatch bestSemanticMatch = findBestSemanticMatch(
                    normalizedRequired, normalizedUserSkills);

            if (bestSemanticMatch != null) {
                results.put(requiredSkill, new SkillMatchResult(
                        bestSemanticMatch.score,
                        MatchType.SEMANTIC,
                        bestSemanticMatch.matchedSkill,
                        bestSemanticMatch.reason));
                continue;
            }

            // 4. NO MATCH (0%)
            results.put(requiredSkill, new SkillMatchResult(
                    0.0, MatchType.NO_MATCH, null, "No related skills found"));
        }

        return results;
    }

    /**
     * Find best semantic match considering learning difficulty
     */
    private SemanticMatch findBestSemanticMatch(String requiredSkill, Set<String> userSkills) {
        Set<String> semanticSkills = SEMANTIC_RELATIONSHIPS.get(requiredSkill);
        if (semanticSkills == null) return null;

        SemanticMatch best = null;

        for (String userSkill : userSkills) {
            // Check if user skill is semantically related to required skill
            if (semanticSkills.stream().anyMatch(sem ->
                    userSkill.contains(sem) || sem.contains(userSkill))) {

                // Calculate score based on learning difficulty
                double score = calculateTransferScore(userSkill, requiredSkill);
                String reason = generateTransferReason(userSkill, requiredSkill, score);

                if (best == null || score > best.score) {
                    best = new SemanticMatch(userSkill, score, reason);
                }
            }

            // Also check reverse relationship
            Set<String> userSemanticSkills = SEMANTIC_RELATIONSHIPS.get(userSkill);
            if (userSemanticSkills != null && userSemanticSkills.stream()
                    .anyMatch(sem -> requiredSkill.contains(sem) || sem.contains(requiredSkill))) {

                double score = calculateTransferScore(userSkill, requiredSkill);
                String reason = generateTransferReason(userSkill, requiredSkill, score);

                if (best == null || score > best.score) {
                    best = new SemanticMatch(userSkill, score, reason);
                }
            }
        }

        return best;
    }

    /**
     * Calculate transfer score based on learning difficulty
     * Score: 0.4 (hard to learn) to 0.6 (easy to learn)
     */
    private double calculateTransferScore(String userSkill, String requiredSkill) {
        Map<String, Double> learningPaths = LEARNING_DIFFICULTY.get(userSkill);
        if (learningPaths != null && learningPaths.containsKey(requiredSkill)) {
            double difficulty = learningPaths.get(requiredSkill);
            // Convert difficulty (0=easy, 1=hard) to score (0.6=easy, 0.4=hard)
            return 0.6 - (difficulty * 0.2);
        }
        // Default semantic score
        return 0.5;
    }

    private String generateTransferReason(String userSkill, String requiredSkill, double score) {
        if (score >= 0.55) {
            return String.format("Can easily learn %s (has %s)", requiredSkill, userSkill);
        } else if (score >= 0.45) {
            return String.format("Can learn %s with training (has %s)", requiredSkill, userSkill);
        } else {
            return String.format("Related experience in %s", userSkill);
        }
    }

    /**
     * Calculate overall semantic score with proficiency consideration
     */
    public double calculateOverallSemanticScore(
            Map<String, Double> userSkillsWithProficiency,
            Map<String, Double> requiredSkillsWithLevel) {

        if (requiredSkillsWithLevel == null || requiredSkillsWithLevel.isEmpty()) return 1.0;
        if (userSkillsWithProficiency == null || userSkillsWithProficiency.isEmpty()) return 0.0;

        Set<String> userSkills = userSkillsWithProficiency.keySet();
        Set<String> requiredSkills = requiredSkillsWithLevel.keySet();

        Map<String, SkillMatchResult> matches = calculateSemanticMatch(userSkills, requiredSkills);

        double totalScore = 0.0;

        for (Map.Entry<String, SkillMatchResult> entry : matches.entrySet()) {
            String requiredSkill = entry.getKey();
            SkillMatchResult matchResult = entry.getValue();
            double baseScore = matchResult.getScore();

            // Consider proficiency if there's a match
            if (matchResult.getMatchedSkill() != null) {
                Double userProficiency = userSkillsWithProficiency.get(matchResult.getMatchedSkill());
                Double requiredLevel = requiredSkillsWithLevel.get(requiredSkill);

                if (userProficiency != null && requiredLevel != null && requiredLevel > 0) {
                    double proficiencyRatio = Math.min(userProficiency / requiredLevel, 1.2);
                    baseScore *= proficiencyRatio;
                }
            }

            totalScore += baseScore;
        }

        return totalScore / requiredSkills.size();
    }

    public Set<String> getMatchedSkills(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty() || userSkills == null) {
            return Collections.emptySet();
        }
        Set<String> u = normalizeSkills(userSkills);
        return normalizeSkills(requiredSkills).stream()
                .filter(u::contains)
                .collect(Collectors.toSet());
    }

    public Set<String> getMissingSkills(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return Collections.emptySet();
        Set<String> matched = getMatchedSkills(userSkills, requiredSkills);
        return normalizeSkills(requiredSkills).stream()
                .filter(s -> !matched.contains(s))
                .collect(Collectors.toSet());
    }

    // ==================== INNER CLASSES ====================

    public enum MatchType {
        EXACT,      // 100% - Same skill
        PARTIAL,    // 70-80% - Contains/substring match
        SEMANTIC,   // 40-60% - Related skill, can learn
        NO_MATCH    // 0% - No relation
    }

    public static class SkillMatchResult {
        private final double score;
        private final MatchType matchType;
        private final String matchedSkill;
        private final String reason;

        public SkillMatchResult(double score, MatchType matchType, String matchedSkill, String reason) {
            this.score = score;
            this.matchType = matchType;
            this.matchedSkill = matchedSkill;
            this.reason = reason;
        }

        public double getScore() { return score; }
        public MatchType getMatchType() { return matchType; }
        public String getMatchedSkill() { return matchedSkill; }
        public String getReason() { return reason; }

        @Override
        public String toString() {
            return String.format("SkillMatchResult{score=%.2f, type=%s, matched='%s', reason='%s'}",
                    score, matchType, matchedSkill, reason);
        }
    }

    private static class SemanticMatch {
        String matchedSkill;
        double score;
        String reason;

        SemanticMatch(String matchedSkill, double score, String reason) {
            this.matchedSkill = matchedSkill;
            this.score = score;
            this.reason = reason;
        }
    }
}

