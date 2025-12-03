package com.mnp.ai.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * SkillCategoryMatcher - groups skills into domains and computes transferability
 */
@Component
public class SkillCategoryMatcher {

    private final SkillNormalizer normalizer;

    @Autowired
    public SkillCategoryMatcher(SkillNormalizer normalizer) {
        this.normalizer = normalizer;
    }

    private static final Map<String, Set<String>> SKILL_CATEGORIES = new HashMap<>();

    static {
        SKILL_CATEGORIES.put("frontend", new HashSet<>(Arrays.asList(
                "react", "vue", "angular", "javascript", "typescript", "html", "css", "next.js", "nuxt.js")));

        SKILL_CATEGORIES.put("backend", new HashSet<>(Arrays.asList(
                "java", "python", "node.js", "spring boot", "django", "flask", "go", "rust", "c++", "c#")));

        SKILL_CATEGORIES.put("cloud", new HashSet<>(Arrays.asList(
                "aws", "amazon web services", "google cloud platform", "gcp", "microsoft azure", "azure", "docker", "kubernetes", "terraform", "jenkins")));

        SKILL_CATEGORIES.put("database", new HashSet<>(Arrays.asList(
                "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "sql", "nosql")));

        SKILL_CATEGORIES.put("ml", new HashSet<>(Arrays.asList(
                "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "keras", "nlp", "computer vision")));

        SKILL_CATEGORIES.put("mobile", new HashSet<>(Arrays.asList(
                "android", "ios", "react native", "flutter", "swift", "kotlin")));

        SKILL_CATEGORIES.put("testing", new HashSet<>(Arrays.asList(
                "junit", "pytest", "jest", "selenium", "cypress", "test automation")));
    }

    public Set<String> getCategories(String skill) {
        if (skill == null || skill.isEmpty()) return Collections.emptySet();
        String s = skill.toLowerCase().trim();
        return SKILL_CATEGORIES.entrySet().stream()
                .filter(e -> e.getValue().stream().anyMatch(term -> s.contains(term)))
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
    }

    public Set<String> getCategoriesForSkills(Set<String> skills) {
        if (skills == null) return Collections.emptySet();
        return skills.stream().flatMap(skill -> getCategories(skill).stream()).collect(Collectors.toSet());
    }

    public double calculateCategoryMatch(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) return 1.0;
        if (userSkills == null || userSkills.isEmpty()) return 0.0;

        Set<String> userCategories = getCategoriesForSkills(userSkills);
        Set<String> requiredCategories = getCategoriesForSkills(requiredSkills);

        if (requiredCategories.isEmpty()) return 0.0;

        long matched = requiredCategories.stream().filter(userCategories::contains).count();
        return (double) matched / requiredCategories.size();
    }

    /**
     * Transferability score: combine exact normalized and category match
     */
    public double calculateTransferabilityScore(Set<String> userSkills, Set<String> requiredSkills) {
        double exact = normalizer.calculateNormalizedMatch(userSkills, requiredSkills);
        double category = calculateCategoryMatch(userSkills, requiredSkills);
        return (0.7 * exact) + (0.3 * category);
    }

    /**
     * Return matched categories for explanation
     */
    public Set<String> getMatchedCategories(Set<String> userSkills, Set<String> requiredSkills) {
        Set<String> uc = getCategoriesForSkills(userSkills);
        Set<String> rc = getCategoriesForSkills(requiredSkills);
        return rc.stream().filter(uc::contains).collect(Collectors.toSet());
    }
}
