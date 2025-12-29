package com.mnp.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Enhanced Skill Category Matcher with intelligent category-based transferability
 * Supports cross-category skill assessment like human reasoning
 */
@Slf4j
@Component
public class SkillCategoryMatcher {

    private final SkillNormalizer normalizer;

    // Category definitions with comprehensive skill mappings
    private static final Map<String, Set<String>> SKILL_CATEGORIES = new HashMap<>();

    // Category transferability matrix (how easy to transfer between categories)
    private static final Map<String, Map<String, Double>> CATEGORY_TRANSFERABILITY = new HashMap<>();

    static {
        initializeCategories();
        initializeCategoryTransferability();
    }

    @Autowired
    public SkillCategoryMatcher(SkillNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    private static void initializeCategories() {
        // ==================== FRONTEND DEVELOPMENT ====================
        SKILL_CATEGORIES.put("frontend", new HashSet<>(Arrays.asList(
                "react", "vue", "vue.js", "angular", "javascript", "typescript",
                "html", "css", "html/css", "sass", "scss", "webpack",
                "next.js", "nuxt.js", "jsx", "frontend development",
                "ui development", "web development", "responsive design"
        )));

        // ==================== BACKEND DEVELOPMENT ====================
        SKILL_CATEGORIES.put("backend", new HashSet<>(Arrays.asList(
                "java", "python", "node.js", "spring boot", "django",
                "flask", "fastapi", "express.js", "nestjs", "go", "rust",
                "c++", "c#", ".net", "php", "ruby", "backend development",
                "server-side", "api development"
        )));

        // ==================== MOBILE DEVELOPMENT ====================
        SKILL_CATEGORIES.put("mobile", new HashSet<>(Arrays.asList(
                "android", "ios", "react native", "flutter", "swift",
                "kotlin", "dart", "mobile development", "ios development",
                "android development", "mobile ui", "mobile ui design",
                "mobile ui development", "mobile ui design principles"
        )));

        // ==================== DATABASE ====================
        SKILL_CATEGORIES.put("database", new HashSet<>(Arrays.asList(
                "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
                "sql", "nosql", "database", "database management",
                "sql server", "oracle", "cassandra", "dynamodb",
                "database design", "query optimization", "database optimization"
        )));

        // ==================== CLOUD & DEVOPS ====================
        SKILL_CATEGORIES.put("cloud", new HashSet<>(Arrays.asList(
                "aws", "amazon web services", "google cloud platform", "gcp",
                "microsoft azure", "azure", "cloud", "cloud architecture",
                "cloud platform"
        )));

        SKILL_CATEGORIES.put("devops", new HashSet<>(Arrays.asList(
                "docker", "kubernetes", "k8s", "terraform", "jenkins",
                "gitlab ci", "github actions", "ci/cd", "ci/cd tools",
                "devops", "containerization", "helm", "ansible",
                "infrastructure", "deployment"
        )));

        // ==================== MACHINE LEARNING & AI ====================
        SKILL_CATEGORIES.put("ml", new HashSet<>(Arrays.asList(
                "machine learning", "deep learning", "tensorflow", "pytorch",
                "scikit-learn", "keras", "ml", "ai", "artificial intelligence",
                "nlp", "natural language processing", "computer vision",
                "data science", "neural networks", "ml model training",
                "nlp model training"
        )));

        SKILL_CATEGORIES.put("data", new HashSet<>(Arrays.asList(
                "data analysis", "data engineering", "etl", "pandas",
                "numpy", "spark", "hadoop", "big data", "data pipeline",
                "data processing", "analytics", "data visualization",
                "data transformation", "data pipeline development"
        )));

        // ==================== TESTING & QA ====================
        SKILL_CATEGORIES.put("testing", new HashSet<>(Arrays.asList(
                "junit", "pytest", "jest", "mocha", "selenium", "cypress",
                "test automation", "testing", "qa", "quality assurance",
                "integration testing", "unit testing", "e2e testing",
                "load testing", "performance testing", "api testing",
                "automation testing", "jmeter", "gatling",
                "load testing methodologies"
        )));

        // ==================== API & INTEGRATION ====================
        SKILL_CATEGORIES.put("api", new HashSet<>(Arrays.asList(
                "rest api", "restful api", "restful api design",
                "restful api integration", "api development", "graphql",
                "grpc", "soap", "websocket", "api", "web api",
                "api gateway", "api testing", "api integration",
                "api performance tuning"
        )));

        // ==================== MICROSERVICES & ARCHITECTURE ====================
        SKILL_CATEGORIES.put("architecture", new HashSet<>(Arrays.asList(
                "microservices", "system architecture", "software architecture",
                "cloud architecture", "enterprise architecture",
                "backend architecture", "distributed systems",
                "architecture", "design patterns", "algorithm design"
        )));

        // ==================== SECURITY ====================
        SKILL_CATEGORIES.put("security", new HashSet<>(Arrays.asList(
                "security", "cybersecurity", "jwt", "oauth", "spring security",
                "authentication", "authorization", "encryption",
                "security principles", "banking security", "pci dss",
                "application security", "penetration testing",
                "fraud detection"
        )));

        // ==================== UI/UX DESIGN ====================
        SKILL_CATEGORIES.put("design", new HashSet<>(Arrays.asList(
                "figma", "sketch", "adobe xd", "ui design", "ux design",
                "ui/ux", "design", "prototyping", "wireframing",
                "user research", "user experience", "interface design",
                "visual design", "interaction design",
                "mobile ui design", "ui/ux design techniques"
        )));

        // ==================== STATE MANAGEMENT ====================
        SKILL_CATEGORIES.put("state_management", new HashSet<>(Arrays.asList(
                "redux", "mobx", "vuex", "ngrx", "zustand", "recoil",
                "state management", "state management (redux)"
        )));

        // ==================== PAYMENT & TRANSACTION ====================
        SKILL_CATEGORIES.put("payment", new HashSet<>(Arrays.asList(
                "stripe", "paypal", "braintree", "square",
                "payment gateway", "payment integration",
                "payment gateway integration", "payment gateway integration (stripe)",
                "stripe api", "transaction management", "webhook"
        )));

        // ==================== PERFORMANCE OPTIMIZATION ====================
        SKILL_CATEGORIES.put("performance", new HashSet<>(Arrays.asList(
                "performance optimization", "performance tuning",
                "query optimization", "caching", "redis",
                "database optimization", "api performance tuning",
                "optimization", "load balancing"
        )));

        // ==================== MESSAGE QUEUE & STREAMING ====================
        SKILL_CATEGORIES.put("messaging", new HashSet<>(Arrays.asList(
                "kafka", "apache kafka", "rabbitmq", "redis", "message queue",
                "event streaming", "pub/sub", "mqtt", "message broker"
        )));

        // ==================== VERSION CONTROL ====================
        SKILL_CATEGORIES.put("version_control", new HashSet<>(Arrays.asList(
                "git", "github", "gitlab", "bitbucket",
                "version control", "source control"
        )));

        // ==================== PROJECT MANAGEMENT ====================
        SKILL_CATEGORIES.put("project_management", new HashSet<>(Arrays.asList(
                "agile", "scrum", "kanban", "jira", "project management",
                "agile project management", "team leadership"
        )));
    }

    private static void initializeCategoryTransferability() {
        // High transferability (0.8-1.0): Very easy to switch
        addTransferability("frontend", "frontend", 1.0);
        addTransferability("frontend", "mobile", 0.7); // React → React Native
        addTransferability("frontend", "state_management", 0.9);
        addTransferability("frontend", "design", 0.6);
        addTransferability("frontend", "testing", 0.7);

        addTransferability("backend", "backend", 1.0);
        addTransferability("backend", "api", 0.9);
        addTransferability("backend", "database", 0.8);
        addTransferability("backend", "microservices", 0.8);
        addTransferability("backend", "security", 0.7);
        addTransferability("backend", "testing", 0.7);
        addTransferability("backend", "devops", 0.6);

        addTransferability("mobile", "mobile", 1.0);
        addTransferability("mobile", "frontend", 0.7);
        addTransferability("mobile", "design", 0.7);

        addTransferability("database", "database", 1.0);
        addTransferability("database", "backend", 0.7);
        addTransferability("database", "performance", 0.8);
        addTransferability("database", "data", 0.7);

        addTransferability("testing", "testing", 1.0);
        addTransferability("testing", "backend", 0.5);
        addTransferability("testing", "frontend", 0.5);
        addTransferability("testing", "mobile", 0.5);

        addTransferability("devops", "devops", 1.0);
        addTransferability("devops", "cloud", 0.9);
        addTransferability("devops", "backend", 0.6);
        addTransferability("devops", "architecture", 0.7);

        addTransferability("cloud", "cloud", 1.0);
        addTransferability("cloud", "devops", 0.9);
        addTransferability("cloud", "architecture", 0.7);

        addTransferability("ml", "ml", 1.0);
        addTransferability("ml", "data", 0.8);
        addTransferability("ml", "backend", 0.5);

        addTransferability("api", "api", 1.0);
        addTransferability("api", "backend", 0.9);
        addTransferability("api", "microservices", 0.8);

        addTransferability("security", "security", 1.0);
        addTransferability("security", "backend", 0.6);
        addTransferability("security", "devops", 0.5);
    }

    private static void addTransferability(String from, String to, double score) {
        CATEGORY_TRANSFERABILITY.putIfAbsent(from, new HashMap<>());
        CATEGORY_TRANSFERABILITY.get(from).put(to, score);
    }

    // ==================== PUBLIC API ====================

    /**
     * Get all categories a skill belongs to
     */
    public Set<String> getCategories(String skill) {
        if (skill == null || skill.isEmpty()) return Collections.emptySet();
        String normalized = skill.toLowerCase().trim();

        return SKILL_CATEGORIES.entrySet().stream()
                .filter(e -> e.getValue().stream()
                        .anyMatch(term -> normalized.contains(term) || term.contains(normalized)))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    /**
     * Get all categories for a set of skills
     */
    public Set<String> getCategoriesForSkills(Set<String> skills) {
        if (skills == null) return Collections.emptySet();
        return skills.stream()
                .flatMap(skill -> getCategories(skill).stream())
                .collect(Collectors.toSet());
    }

    /**
     * Calculate basic category match percentage
     */
    public double calculateCategoryMatch(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return 1.0;
        if (userSkills == null || userSkills.isEmpty()) return 0.0;

        Set<String> userCategories = getCategoriesForSkills(userSkills);
        Set<String> requiredCategories = getCategoriesForSkills(requiredSkills);

        if (requiredCategories.isEmpty()) return 0.0;

        long matched = requiredCategories.stream()
                .filter(userCategories::contains)
                .count();

        return (double) matched / requiredCategories.size();
    }

    /**
     * Calculate transferability score with category intelligence
     * This considers how easy it is to transfer skills between categories
     */
    public double calculateTransferabilityScore(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return 1.0;
        if (userSkills == null || userSkills.isEmpty()) return 0.0;

        Set<String> userCategories = getCategoriesForSkills(userSkills);
        Set<String> requiredCategories = getCategoriesForSkills(requiredSkills);

        if (requiredCategories.isEmpty()) return 0.0;
        if (userCategories.isEmpty()) return 0.0;

        double totalTransferScore = 0.0;

        for (String requiredCategory : requiredCategories) {
            double bestTransferScore = 0.0;

            for (String userCategory : userCategories) {
                Map<String, Double> transferMap = CATEGORY_TRANSFERABILITY.get(userCategory);
                if (transferMap != null) {
                    double transferScore = transferMap.getOrDefault(requiredCategory, 0.0);
                    bestTransferScore = Math.max(bestTransferScore, transferScore);
                }
            }

            totalTransferScore += bestTransferScore;
        }

        return totalTransferScore / requiredCategories.size();
    }

    /**
     * Get matched categories for explanation
     */
    public Set<String> getMatchedCategories(Set<String> userSkills, Set<String> requiredSkills) {
        Set<String> userCategories = getCategoriesForSkills(userSkills);
        Set<String> requiredCategories = getCategoriesForSkills(requiredSkills);
        return requiredCategories.stream()
                .filter(userCategories::contains)
                .collect(Collectors.toSet());
    }

    /**
     * Calculate comprehensive category-based score
     * Combines exact match with transferability
     */
    public double calculateComprehensiveCategoryScore(
            Set<String> userSkills,
            Set<String> requiredSkills) {

        double exactMatch = normalizer.calculateNormalizedMatch(userSkills, requiredSkills);
        double categoryMatch = calculateCategoryMatch(userSkills, requiredSkills);
        double transferability = calculateTransferabilityScore(userSkills, requiredSkills);

        // Weighted combination
        return (0.5 * exactMatch) + (0.25 * categoryMatch) + (0.25 * transferability);
    }

    /**
     * Explain category-based matching for a candidate
     */
    public String explainCategoryMatching(Set<String> userSkills, Set<String> requiredSkills) {
        Set<String> userCategories = getCategoriesForSkills(userSkills);
        Set<String> requiredCategories = getCategoriesForSkills(requiredSkills);
        Set<String> matchedCategories = getMatchedCategories(userSkills, requiredSkills);

        StringBuilder explanation = new StringBuilder();
        explanation.append("Category Analysis:\n");

        if (!matchedCategories.isEmpty()) {
            explanation.append(String.format("✅ Strong matches in: %s\n",
                    String.join(", ", matchedCategories)));
        }

        Set<String> missingCategories = new HashSet<>(requiredCategories);
        missingCategories.removeAll(matchedCategories);

        if (!missingCategories.isEmpty()) {
            List<String> canTransfer = new ArrayList<>();
            List<String> needsTraining = new ArrayList<>();

            for (String missing : missingCategories) {
                double bestTransfer = 0.0;
                String bestFrom = null;

                for (String userCat : userCategories) {
                    Map<String, Double> transferMap = CATEGORY_TRANSFERABILITY.get(userCat);
                    if (transferMap != null) {
                        double score = transferMap.getOrDefault(missing, 0.0);
                        if (score > bestTransfer) {
                            bestTransfer = score;
                            bestFrom = userCat;
                        }
                    }
                }

                if (bestTransfer >= 0.6) {
                    canTransfer.add(String.format("%s (from %s)", missing, bestFrom));
                } else if (bestTransfer > 0.3) {
                    needsTraining.add(String.format("%s (with training)", missing));
                } else {
                    needsTraining.add(missing);
                }
            }

            if (!canTransfer.isEmpty()) {
                explanation.append(String.format("🔄 Can transfer to: %s\n",
                        String.join(", ", canTransfer)));
            }

            if (!needsTraining.isEmpty()) {
                explanation.append(String.format("📚 Needs training for: %s\n",
                        String.join(", ", needsTraining)));
            }
        }

        double transferScore = calculateTransferabilityScore(userSkills, requiredSkills);
        explanation.append(String.format("Overall transferability: %.1f%%", transferScore * 100));

        return explanation.toString();
    }
}