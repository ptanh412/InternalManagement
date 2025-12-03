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

    // Map synonyms to canonical skill names
    private static final Map<String, String> SKILL_SYNONYMS = new HashMap<>();

    // Semantic skill relationships (skill -> related skills that indicate capability)
    private static final Map<String, Set<String>> SEMANTIC_RELATIONSHIPS = new HashMap<>();

    static {
        // ==================== EXISTING SYNONYMS ====================
        // Programming
        SKILL_SYNONYMS.put("js", "javascript");
        SKILL_SYNONYMS.put("javascript (es6+)", "javascript");
        SKILL_SYNONYMS.put("ts", "typescript");
        SKILL_SYNONYMS.put("py", "python");

        // APIs / Web
        SKILL_SYNONYMS.put("rest api", "restful api");
        SKILL_SYNONYMS.put("restful apis", "restful api");
        SKILL_SYNONYMS.put("restful api integration", "restful api");
        SKILL_SYNONYMS.put("restful apis integration", "restful api");
        SKILL_SYNONYMS.put("api development", "restful api");
        SKILL_SYNONYMS.put("web api", "restful api");

        // Cloud & DevOps
        SKILL_SYNONYMS.put("k8s", "kubernetes");
        SKILL_SYNONYMS.put("docker compose", "docker");
        SKILL_SYNONYMS.put("gcp", "google cloud platform");
        SKILL_SYNONYMS.put("aws", "amazon web services");
        SKILL_SYNONYMS.put("azure", "microsoft azure");

        // Frameworks
        SKILL_SYNONYMS.put("spring", "spring boot");
        SKILL_SYNONYMS.put("react.js", "react");
        SKILL_SYNONYMS.put("react 360", "react");
        SKILL_SYNONYMS.put("vue.js", "vue");
        SKILL_SYNONYMS.put("angular.js", "angular");

        // Databases
        SKILL_SYNONYMS.put("postgres", "postgresql");
        SKILL_SYNONYMS.put("mysql server", "mysql");
        SKILL_SYNONYMS.put("mongo", "mongodb");
        SKILL_SYNONYMS.put("database management", "database");

        // ML
        SKILL_SYNONYMS.put("ml", "machine learning");
        SKILL_SYNONYMS.put("ai", "artificial intelligence");
        SKILL_SYNONYMS.put("deep learning", "machine learning");

        // Testing
        SKILL_SYNONYMS.put("integration testing", "testing");
        SKILL_SYNONYMS.put("load testing", "performance testing");
        SKILL_SYNONYMS.put("automation testing", "testing");
        SKILL_SYNONYMS.put("api testing", "testing");

        // Mobile
        SKILL_SYNONYMS.put("ios development", "mobile development");
        SKILL_SYNONYMS.put("android development", "mobile development");
        SKILL_SYNONYMS.put("mobile ui development", "mobile development");

        // Design
        SKILL_SYNONYMS.put("ui design", "design");
        SKILL_SYNONYMS.put("ux design", "design");
        SKILL_SYNONYMS.put("ui/ux design", "design");

        // Data
        SKILL_SYNONYMS.put("data analysis", "analytics");
        SKILL_SYNONYMS.put("data engineering", "data processing");
        SKILL_SYNONYMS.put("data pipeline development", "etl");

        // Architecture
        SKILL_SYNONYMS.put("software architecture", "system architecture");
        SKILL_SYNONYMS.put("enterprise architecture", "system architecture");
        SKILL_SYNONYMS.put("cloud architecture", "system architecture");

        // Security
        SKILL_SYNONYMS.put("security principles", "security");
        SKILL_SYNONYMS.put("banking security", "security");
        SKILL_SYNONYMS.put("application security", "security");

        // Performance
        SKILL_SYNONYMS.put("performance tuning", "performance optimization");
        SKILL_SYNONYMS.put("database optimization", "query optimization");

        // Java variants
        SKILL_SYNONYMS.put("java spring boot", "spring boot");
        SKILL_SYNONYMS.put("spring framework", "spring boot");

        // Python variants
        SKILL_SYNONYMS.put("python/fastapi", "fastapi");

        // Mobile variants
        SKILL_SYNONYMS.put("flutter/dart", "flutter");

        // State management
        SKILL_SYNONYMS.put("state management (redux)", "redux");

        // ==================== NEW SEMANTIC RELATIONSHIPS ====================

        // RESTful API Design - người có các skills này CÓ KHẢ NĂNG làm RESTful API
        SEMANTIC_RELATIONSHIPS.put("restful api design", new HashSet<>(Arrays.asList(
                "spring boot",      // Spring Boot core là REST API
                "express.js",
                "express",
                "nestjs",
                "django",
                "flask",
                "fastapi",
                "java",             // Java backend thường làm API
                "node.js",          // Node.js backend thường làm API
                "microservices",    // Microservices = APIs
                "api development",
                "backend development",
                "web services"
        )));

        // API Performance Tuning - người có các skills này CÓ KHẢ NĂNG tune API
        SEMANTIC_RELATIONSHIPS.put("api performance tuning", new HashSet<>(Arrays.asList(
                "spring boot",              // Spring Boot dev biết optimize
                "java",                     // Java dev có kinh nghiệm performance
                "node.js",                  // Node.js dev biết async/performance
                "database optimization",
                "query optimization",
                "caching",
                "redis",
                "performance optimization",
                "application performance optimization",
                "microservices",            // Microservices cần performance tuning
                "backend development"
        )));

        // Node.js - người có các skills này CÓ THỂ HỌC Node.js nhanh
        SEMANTIC_RELATIONSHIPS.put("node.js", new HashSet<>(Arrays.asList(
                "javascript",       // JavaScript dev học Node.js dễ
                "typescript",       // TypeScript dev học Node.js dễ
                "express.js",
                "express",
                "nestjs",
                "backend development",
                "restful api"
        )));

        // PostgreSQL - người có các skills này CÓ THỂ LÀM PostgreSQL
        SEMANTIC_RELATIONSHIPS.put("postgresql", new HashSet<>(Arrays.asList(
                "mysql",            // SQL database tương đồng
                "sql",
                "database management",
                "database",
                "database optimization",
                "sql server",
                "oracle",
                "relational database"
        )));

        // MySQL - người có các skills này CÓ THỂ LÀM MySQL
        SEMANTIC_RELATIONSHIPS.put("mysql", new HashSet<>(Arrays.asList(
                "postgresql",
                "sql",
                "database management",
                "database",
                "mariadb",
                "sql server"
        )));

        // Spring Boot - người có các skills này CÓ KHẢ NĂNG
        SEMANTIC_RELATIONSHIPS.put("spring boot", new HashSet<>(Arrays.asList(
                "java",
                "spring",
                "spring framework",
                "hibernate",
                "jpa",
                "maven",
                "gradle"
        )));

        // React - người có các skills này CÓ THỂ HỌC React
        SEMANTIC_RELATIONSHIPS.put("react", new HashSet<>(Arrays.asList(
                "javascript",
                "typescript",
                "vue",
                "angular",
                "next.js",
                "redux",
                "frontend development"
        )));

        // Database Management - các DB skills tương đương
        SEMANTIC_RELATIONSHIPS.put("database management", new HashSet<>(Arrays.asList(
                "postgresql",
                "mysql",
                "mongodb",
                "sql",
                "database",
                "database optimization",
                "query optimization"
        )));

        // Backend Development - các skills backend
        SEMANTIC_RELATIONSHIPS.put("backend development", new HashSet<>(Arrays.asList(
                "java",
                "spring boot",
                "node.js",
                "python",
                "django",
                "flask",
                "go",
                "restful api",
                "microservices",
                "api development"
        )));

        // Frontend Development
        SEMANTIC_RELATIONSHIPS.put("frontend development", new HashSet<>(Arrays.asList(
                "react",
                "vue",
                "angular",
                "javascript",
                "typescript",
                "html",
                "css",
                "next.js"
        )));

        // Microservices
        SEMANTIC_RELATIONSHIPS.put("microservices", new HashSet<>(Arrays.asList(
                "spring boot",
                "docker",
                "kubernetes",
                "restful api",
                "api gateway",
                "message queue",
                "distributed systems"
        )));

        // Docker
        SEMANTIC_RELATIONSHIPS.put("docker", new HashSet<>(Arrays.asList(
                "kubernetes",
                "containerization",
                "devops",
                "ci/cd",
                "docker compose"
        )));

        // ==================== COMPREHENSIVE SKILL RELATIONSHIPS (Based on Task Data) ====================

        // JavaScript Ecosystem - người biết JavaScript có thể học/làm được
        SEMANTIC_RELATIONSHIPS.put("javascript", new HashSet<>(Arrays.asList(
                "typescript", "node.js", "react", "vue", "vue.js", "angular",
                "next.js", "express.js", "nestjs", "react native",
                "frontend development", "backend development", "jest", "mocha"
        )));

        // TypeScript - strongly related to JavaScript ecosystem
        SEMANTIC_RELATIONSHIPS.put("typescript", new HashSet<>(Arrays.asList(
                "javascript", "angular", "react", "vue", "node.js",
                "nestjs", "next.js", "frontend development"
        )));

        // Vue.js - người biết React/Angular có thể học Vue
        SEMANTIC_RELATIONSHIPS.put("vue.js", new HashSet<>(Arrays.asList(
                "react", "angular", "javascript", "typescript",
                "vue", "next.js", "frontend development", "html/css",
                "state management", "redux"
        )));
        SEMANTIC_RELATIONSHIPS.put("vue", new HashSet<>(Arrays.asList(
                "react", "angular", "javascript", "typescript",
                "vue.js", "frontend development", "html/css"
        )));

        // Angular - người biết React/Vue có thể học Angular
        SEMANTIC_RELATIONSHIPS.put("angular", new HashSet<>(Arrays.asList(
                "react", "vue", "vue.js", "typescript", "javascript",
                "frontend development", "rxjs", "html/css"
        )));

        // React Native - mobile development with React knowledge
        SEMANTIC_RELATIONSHIPS.put("react native", new HashSet<>(Arrays.asList(
                "react", "javascript", "typescript", "mobile development",
                "ios development", "android development", "flutter",
                "mobile ui development", "mobile ui design principles"
        )));

        // Java Ecosystem
        SEMANTIC_RELATIONSHIPS.put("java", new HashSet<>(Arrays.asList(
                "spring boot", "spring", "spring framework", "hibernate",
                "jpa", "maven", "gradle", "junit", "spring security",
                "microservices", "backend development", "restful api"
        )));

        // Python Ecosystem
        SEMANTIC_RELATIONSHIPS.put("python", new HashSet<>(Arrays.asList(
                "django", "flask", "fastapi", "machine learning",
                "tensorflow", "pytorch", "scikit-learn", "pandas",
                "numpy", "data analysis", "nlp", "ai", "etl",
                "data engineering", "automation testing", "selenium"
        )));

        // Machine Learning & AI
        SEMANTIC_RELATIONSHIPS.put("machine learning", new HashSet<>(Arrays.asList(
                "python", "tensorflow", "pytorch", "scikit-learn",
                "deep learning", "ai", "nlp", "data analysis",
                "pandas", "numpy", "keras", "ml model training",
                "nlp model training"
        )));
        SEMANTIC_RELATIONSHIPS.put("tensorflow", new HashSet<>(Arrays.asList(
                "python", "machine learning", "deep learning", "keras",
                "pytorch", "nlp", "ai", "ml model training"
        )));
        SEMANTIC_RELATIONSHIPS.put("nlp", new HashSet<>(Arrays.asList(
                "python", "machine learning", "tensorflow", "natural language processing",
                "ai", "deep learning", "nlp model training"
        )));

        // Mobile Development
        SEMANTIC_RELATIONSHIPS.put("android", new HashSet<>(Arrays.asList(
                "kotlin", "java", "mobile development", "android sdk",
                "mobile ui development", "flutter", "react native"
        )));
        SEMANTIC_RELATIONSHIPS.put("kotlin", new HashSet<>(Arrays.asList(
                "android", "java", "mobile development", "android sdk"
        )));
        SEMANTIC_RELATIONSHIPS.put("swift", new HashSet<>(Arrays.asList(
                "ios", "ios development", "ios sdk", "mobile development",
                "xcode", "objective-c"
        )));
        SEMANTIC_RELATIONSHIPS.put("ios sdk", new HashSet<>(Arrays.asList(
                "swift", "ios development", "mobile development", "xcode"
        )));
        SEMANTIC_RELATIONSHIPS.put("flutter", new HashSet<>(Arrays.asList(
                "dart", "mobile development", "android", "ios",
                "react native", "flutter/dart"
        )));

        // Database Skills - SQL databases are interchangeable
        SEMANTIC_RELATIONSHIPS.put("sql", new HashSet<>(Arrays.asList(
                "postgresql", "mysql", "sql server", "oracle",
                "database management", "database", "query optimization",
                "database design", "database optimization"
        )));
        SEMANTIC_RELATIONSHIPS.put("mongodb", new HashSet<>(Arrays.asList(
                "nosql", "database", "database management", "node.js",
                "express.js", "backend development", "database design"
        )));

        // Testing Skills
        SEMANTIC_RELATIONSHIPS.put("junit", new HashSet<>(Arrays.asList(
                "java", "testing", "unit testing", "mockito",
                "spring boot", "integration testing"
        )));
        SEMANTIC_RELATIONSHIPS.put("jest", new HashSet<>(Arrays.asList(
                "javascript", "typescript", "react", "node.js",
                "testing", "unit testing", "integration testing"
        )));
        SEMANTIC_RELATIONSHIPS.put("jmeter", new HashSet<>(Arrays.asList(
                "load testing", "performance testing", "api testing",
                "testing", "gatling", "load testing methodologies"
        )));
        SEMANTIC_RELATIONSHIPS.put("selenium", new HashSet<>(Arrays.asList(
                "automation testing", "testing", "java", "python",
                "web testing", "integration testing"
        )));
        SEMANTIC_RELATIONSHIPS.put("postman", new HashSet<>(Arrays.asList(
                "api testing", "rest api", "restful api", "testing",
                "api development", "swagger"
        )));

        // API & Integration
        SEMANTIC_RELATIONSHIPS.put("rest api", new HashSet<>(Arrays.asList(
                "restful api", "api development", "restful api design",
                "restful api integration", "spring boot", "node.js",
                "express.js", "microservices", "backend development",
                "api testing", "postman", "swagger"
        )));
        SEMANTIC_RELATIONSHIPS.put("restful api integration", new HashSet<>(Arrays.asList(
                "rest api", "restful api", "api development",
                "restful api design", "microservices", "backend development",
                "node.js", "spring boot", "http client"
        )));
        SEMANTIC_RELATIONSHIPS.put("websocket", new HashSet<>(Arrays.asList(
                "node.js", "socket.io", "real-time communication",
                "backend development", "javascript", "web api"
        )));

        // Payment Integration
        SEMANTIC_RELATIONSHIPS.put("stripe api", new HashSet<>(Arrays.asList(
                "payment gateway", "payment integration", "payment gateway integration",
                "api integration", "webhook", "backend development"
        )));
        SEMANTIC_RELATIONSHIPS.put("payment gateway integration", new HashSet<>(Arrays.asList(
                "stripe", "stripe api", "payment gateway", "webhook",
                "backend development", "transaction management", "api integration"
        )));

        // Cloud & DevOps
        SEMANTIC_RELATIONSHIPS.put("kubernetes", new HashSet<>(Arrays.asList(
                "docker", "k8s", "containerization", "devops",
                "microservices", "cloud architecture", "deployment"
        )));
        SEMANTIC_RELATIONSHIPS.put("aws", new HashSet<>(Arrays.asList(
                "amazon web services", "cloud", "cloud architecture",
                "devops", "aws networking", "cloud platform"
        )));
        SEMANTIC_RELATIONSHIPS.put("ci/cd", new HashSet<>(Arrays.asList(
                "jenkins", "gitlab ci", "github actions", "devops",
                "docker", "kubernetes", "ci/cd tools", "automation"
        )));

        // Architecture & Design
        SEMANTIC_RELATIONSHIPS.put("system architecture", new HashSet<>(Arrays.asList(
                "software architecture", "microservices", "cloud architecture",
                "enterprise architecture", "backend architecture",
                "distributed systems", "architecture design"
        )));
        SEMANTIC_RELATIONSHIPS.put("algorithm design", new HashSet<>(Arrays.asList(
                "data structures", "optimization", "computer science",
                "problem solving", "software engineering"
        )));

        // Security
        SEMANTIC_RELATIONSHIPS.put("jwt", new HashSet<>(Arrays.asList(
                "authentication", "authorization", "security",
                "spring security", "oauth", "api security"
        )));
        SEMANTIC_RELATIONSHIPS.put("spring security", new HashSet<>(Arrays.asList(
                "java", "spring boot", "security", "authentication",
                "authorization", "jwt", "oauth"
        )));
        SEMANTIC_RELATIONSHIPS.put("pci dss", new HashSet<>(Arrays.asList(
                "security", "compliance", "banking security",
                "payment security", "security principles"
        )));

        // UI/UX & Design
        SEMANTIC_RELATIONSHIPS.put("figma", new HashSet<>(Arrays.asList(
                "ui design", "ux design", "design", "prototyping",
                "ui/ux design", "mobile ui design", "user research",
                "ui/ux design techniques"
        )));
        SEMANTIC_RELATIONSHIPS.put("html/css", new HashSet<>(Arrays.asList(
                "html", "css", "frontend development", "web development",
                "javascript", "react", "vue", "angular"
        )));

        // Data & Analytics
        SEMANTIC_RELATIONSHIPS.put("data visualization", new HashSet<>(Arrays.asList(
                "chart.js", "d3.js", "analytics", "data analysis",
                "dashboard", "reporting", "bi tools"
        )));
        SEMANTIC_RELATIONSHIPS.put("etl", new HashSet<>(Arrays.asList(
                "data engineering", "python", "data pipeline",
                "data processing", "data transformation",
                "data pipeline development"
        )));
        SEMANTIC_RELATIONSHIPS.put("analytics", new HashSet<>(Arrays.asList(
                "data analysis", "data visualization", "reporting",
                "business intelligence", "metrics"
        )));

        // Performance & Optimization
        SEMANTIC_RELATIONSHIPS.put("query optimization", new HashSet<>(Arrays.asList(
                "database optimization", "sql", "postgresql", "mysql",
                "performance optimization", "database design",
                "performance tuning"
        )));
        SEMANTIC_RELATIONSHIPS.put("caching", new HashSet<>(Arrays.asList(
                "redis", "memcached", "performance optimization",
                "backend development", "api performance tuning"
        )));
        SEMANTIC_RELATIONSHIPS.put("redis", new HashSet<>(Arrays.asList(
                "caching", "nosql", "database", "performance optimization",
                "session management", "backend development"
        )));

        // Messaging & Streaming
        SEMANTIC_RELATIONSHIPS.put("apache kafka", new HashSet<>(Arrays.asList(
                "kafka", "message queue", "event streaming",
                "distributed systems", "microservices", "real-time processing"
        )));
        SEMANTIC_RELATIONSHIPS.put("mqtt", new HashSet<>(Arrays.asList(
                "iot", "messaging", "message queue", "publish-subscribe",
                "real-time communication"
        )));

        // Blockchain
        SEMANTIC_RELATIONSHIPS.put("blockchain", new HashSet<>(Arrays.asList(
                "cryptocurrency", "smart contracts", "distributed ledger",
                "web3", "ethereum", "solidity"
        )));

        // Monitoring & Observability
        SEMANTIC_RELATIONSHIPS.put("prometheus/grafana", new HashSet<>(Arrays.asList(
                "monitoring", "metrics", "observability", "devops",
                "kubernetes", "alerting", "dashboard"
        )));

        // State Management
        SEMANTIC_RELATIONSHIPS.put("redux", new HashSet<>(Arrays.asList(
                "react", "state management", "javascript", "typescript",
                "frontend development", "mobx", "vuex"
        )));
        SEMANTIC_RELATIONSHIPS.put("state management", new HashSet<>(Arrays.asList(
                "redux", "vuex", "mobx", "react", "vue",
                "frontend development", "state management (redux)"
        )));

        // Communication Protocols
        SEMANTIC_RELATIONSHIPS.put("smtp", new HashSet<>(Arrays.asList(
                "email", "messaging", "node.js", "backend development",
                "nodemailer", "email integration"
        )));

        // Additional API Integrations
        SEMANTIC_RELATIONSHIPS.put("google maps api", new HashSet<>(Arrays.asList(
                "maps", "geolocation", "api integration", "javascript",
                "mobile development", "location services"
        )));
        SEMANTIC_RELATIONSHIPS.put("twilio api", new HashSet<>(Arrays.asList(
                "sms", "messaging", "api integration", "communication",
                "backend development", "telephony"
        )));
        SEMANTIC_RELATIONSHIPS.put("alexa api", new HashSet<>(Arrays.asList(
                "voice assistant", "ai", "node.js", "api integration",
                "smart home", "voice ui"
        )));

        // Streaming & Media
        SEMANTIC_RELATIONSHIPS.put("hls", new HashSet<>(Arrays.asList(
                "video streaming", "http live streaming", "media",
                "cdn", "video processing", "multimedia"
        )));
        SEMANTIC_RELATIONSHIPS.put("cdn", new HashSet<>(Arrays.asList(
                "content delivery", "caching", "performance",
                "cloud", "web performance", "hls"
        )));

        // Project Management
        SEMANTIC_RELATIONSHIPS.put("agile", new HashSet<>(Arrays.asList(
                "scrum", "agile project management", "project management",
                "kanban", "software development methodology"
        )));

        // Version Control
        SEMANTIC_RELATIONSHIPS.put("git", new HashSet<>(Arrays.asList(
                "github", "gitlab", "version control", "source control",
                "git workflow", "devops"
        )));

        // Transaction & Business Logic
        SEMANTIC_RELATIONSHIPS.put("transaction management", new HashSet<>(Arrays.asList(
                "database", "spring boot", "jpa", "hibernate",
                "acid", "database design", "backend development"
        )));

        // Rules & Business Logic
        SEMANTIC_RELATIONSHIPS.put("rules engine", new HashSet<>(Arrays.asList(
                "business logic", "drools", "decision engine",
                "backend development", "workflow"
        )));

        // Fraud & Security
        SEMANTIC_RELATIONSHIPS.put("fraud detection", new HashSet<>(Arrays.asList(
                "machine learning", "security", "data analysis",
                "anomaly detection", "risk management"
        )));

        // Stock & Finance
        SEMANTIC_RELATIONSHIPS.put("stock api", new HashSet<>(Arrays.asList(
                "financial api", "api integration", "real-time data",
                "market data", "trading"
        )));
    }

    /**
     * Normalize a skill string
     */
    public String normalizeSkill(String skill) {
        if (skill == null || skill.trim().isEmpty()) return "";
        String key = skill.toLowerCase().trim();
        return SKILL_SYNONYMS.getOrDefault(key, key);
    }

    /**
     * Normalize a set of skills
     */
    public Set<String> normalizeSkills(Set<String> skills) {
        if (skills == null) return Collections.emptySet();
        return skills.stream()
                .map(this::normalizeSkill)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }

    /**
     * Calculate normalized match ratio (exact match after normalization)
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
     * NEW: Calculate semantic match với weighted scoring
     * Returns a match score between 0.0 and 1.0 cho từng required skill
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
                            skill -> new SkillMatchResult(0.0, MatchType.NO_MATCH, null)
                    ));
        }

        Set<String> normalizedUserSkills = normalizeSkills(userSkills);
        Map<String, SkillMatchResult> results = new HashMap<>();

        for (String requiredSkill : requiredSkills) {
            String normalizedRequired = normalizeSkill(requiredSkill);

            // 1. Check for exact match (1.0 score)
            if (normalizedUserSkills.contains(normalizedRequired)) {
                results.put(requiredSkill, new SkillMatchResult(
                        1.0, MatchType.EXACT, normalizedRequired));
                continue;
            }

            // 2. Check for substring/partial match (0.7 score)
            String partialMatch = normalizedUserSkills.stream()
                    .filter(userSkill ->
                            userSkill.contains(normalizedRequired) ||
                                    normalizedRequired.contains(userSkill))
                    .findFirst()
                    .orElse(null);

            if (partialMatch != null) {
                results.put(requiredSkill, new SkillMatchResult(
                        0.7, MatchType.PARTIAL, partialMatch));
                continue;
            }

            // 3. Check for semantic relationship (0.5 score)
            Set<String> semanticSkills = SEMANTIC_RELATIONSHIPS.get(normalizedRequired);
            if (semanticSkills != null) {
                String semanticMatch = normalizedUserSkills.stream()
                        .filter(userSkill -> semanticSkills.stream()
                                .anyMatch(sem -> userSkill.contains(sem) || sem.contains(userSkill)))
                        .findFirst()
                        .orElse(null);

                if (semanticMatch != null) {
                    results.put(requiredSkill, new SkillMatchResult(
                            0.5, MatchType.SEMANTIC, semanticMatch));
                    continue;
                }
            }

            // 4. No match (0.0 score)
            results.put(requiredSkill, new SkillMatchResult(
                    0.0, MatchType.NO_MATCH, null));
        }

        return results;
    }

    /**
     * Calculate overall semantic score
     */
    public double calculateOverallSemanticScore(Set<String> userSkills, Set<String> requiredSkills) {
        Map<String, SkillMatchResult> matches = calculateSemanticMatch(userSkills, requiredSkills);
        if (matches.isEmpty()) return 1.0;

        double totalScore = matches.values().stream()
                .mapToDouble(SkillMatchResult::getScore)
                .sum();

        return totalScore / matches.size();
    }

    /**
     * Get matched skills (canonical names)
     */
    public Set<String> getMatchedSkills(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty() || userSkills == null) {
            return Collections.emptySet();
        }
        Set<String> u = normalizeSkills(userSkills);
        return normalizeSkills(requiredSkills).stream()
                .filter(u::contains)
                .collect(Collectors.toSet());
    }

    /**
     * Get missing required skills (canonical names)
     */
    public Set<String> getMissingSkills(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return Collections.emptySet();
        Set<String> matched = getMatchedSkills(userSkills, requiredSkills);
        return normalizeSkills(requiredSkills).stream()
                .filter(s -> !matched.contains(s))
                .collect(Collectors.toSet());
    }

    /**
     * Calculate semantic skill match using AI for unknown skills
     * This allows the system to be smart even with completely new skills
     */
    public double calculateSemanticMatchWithAI(String userSkill, String requiredSkill) {
        // First try exact match
        if (userSkill.equalsIgnoreCase(requiredSkill)) {
            return 1.0;
        }

        // Normalize both skills
        String normalizedUser = normalizeSkill(userSkill);
        String normalizedRequired = normalizeSkill(requiredSkill);

        // Check if normalized versions match
        if (normalizedUser.equals(normalizedRequired)) {
            return 1.0;
        }

        // Check semantic relationships
        if (areSkillsRelated(normalizedUser, normalizedRequired)) {
            return 0.8; // High match for known relationships
        }

        // Check partial match
        if (normalizedUser.contains(normalizedRequired) || normalizedRequired.contains(normalizedUser)) {
            return 0.7;
        }

        // For completely unknown skills, use AI to determine similarity
        try {
            double aiSimilarity = calculateAISimilarity(userSkill, requiredSkill);
            if (aiSimilarity > 0.6) {
                log.info("AI-powered match: {} <-> {} = {}", userSkill, requiredSkill, aiSimilarity);
            }
            return aiSimilarity;
        } catch (Exception e) {
            log.warn("AI similarity calculation failed, using basic match: {}", e.getMessage());
            return 0.0;
        }
    }

    /**
     * Use AI (Gemini) to calculate skill similarity for unknown skills
     * This makes the system adaptive without hardcoding
     */
    private double calculateAISimilarity(String skill1, String skill2) {
        // TODO: Implement Gemini AI call here
        // For now, return basic string similarity
        return calculateStringSimilarity(skill1, skill2);
    }

    /**
     * Basic string similarity using Levenshtein distance
     */
    private double calculateStringSimilarity(String s1, String s2) {
        String str1 = s1.toLowerCase();
        String str2 = s2.toLowerCase();

        int maxLen = Math.max(str1.length(), str2.length());
        if (maxLen == 0) return 1.0;

        int distance = levenshteinDistance(str1, str2);
        return 1.0 - ((double) distance / maxLen);
    }

    /**
     * Calculate Levenshtein distance between two strings
     */
    private int levenshteinDistance(String s1, String s2) {
        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) {
            dp[i][0] = i;
        }
        for (int j = 0; j <= s2.length(); j++) {
            dp[0][j] = j;
        }

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = s1.charAt(i - 1) == s2.charAt(j - 1) ? 0 : 1;
                dp[i][j] = Math.min(
                        Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                        dp[i - 1][j - 1] + cost
                );
            }
        }

        return dp[s1.length()][s2.length()];
    }

    /**
     * Check if two skills are semantically related
     */
    private boolean areSkillsRelated(String skill1, String skill2) {
        // Check if skill1 is related to skill2
        Set<String> relatedSkills = SEMANTIC_RELATIONSHIPS.get(skill1);
        if (relatedSkills != null && relatedSkills.contains(skill2)) {
            return true;
        }

        // Check reverse relationship
        Set<String> reverseRelatedSkills = SEMANTIC_RELATIONSHIPS.get(skill2);
        return reverseRelatedSkills != null && reverseRelatedSkills.contains(skill1);
    }

    // ==================== INNER CLASSES ====================

    public enum MatchType {
        EXACT,      // 100% match (same skill)
        PARTIAL,    // 70% match (substring/contains)
        SEMANTIC,   // 50% match (related skill)
        NO_MATCH    // 0% match
    }

    public static class SkillMatchResult {
        private final double score;
        private final MatchType matchType;
        private final String matchedSkill;

        public SkillMatchResult(double score, MatchType matchType, String matchedSkill) {
            this.score = score;
            this.matchType = matchType;
            this.matchedSkill = matchedSkill;
        }

        public double getScore() { return score; }
        public MatchType getMatchType() { return matchType; }
        public String getMatchedSkill() { return matchedSkill; }

        @Override
        public String toString() {
            return String.format("SkillMatchResult{score=%.2f, type=%s, matched='%s'}",
                    score, matchType, matchedSkill);
        }
    }
}

