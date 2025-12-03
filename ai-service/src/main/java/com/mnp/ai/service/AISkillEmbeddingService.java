package com.mnp.ai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * AI-Powered Skill Embedding Service Client
 *
 * Calls ML-service Python endpoints to get semantic skill similarities
 * Example: Knows that "Rust" is 85% similar to "C++", "React" is 88% similar to "Vue"
 */
@Service
@Slf4j
public class AISkillEmbeddingService {

    private final RestTemplate restTemplate;
    private final String mlServiceUrl;

    public AISkillEmbeddingService(
            RestTemplate restTemplate,
            @Value("${ml.service.url:http://localhost:8091/ml-service}") String mlServiceUrl) {
        this.restTemplate = restTemplate;
        this.mlServiceUrl = mlServiceUrl;
    }

    /**
     * Calculate AI-powered skill similarity
     *
     * @param skill1 First skill
     * @param skill2 Second skill
     * @return Similarity score (0.0 to 1.0), or -1 if service unavailable
     */
    public double calculateAISimilarity(String skill1, String skill2) {
        try {
            String endpoint = mlServiceUrl + "/ml/skills/similarity";

            Map<String, String> request = new HashMap<>();
            request.put("skill1", skill1);
            request.put("skill2", skill2);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object similarity = response.getBody().get("similarity");
                if (similarity instanceof Number) {
                    double sim = ((Number) similarity).doubleValue();
                    log.debug("AI similarity: {} ↔ {} = {:.2f}", skill1, skill2, sim);
                    return sim;
                }
            }

            return -1.0; // Service unavailable

        } catch (Exception e) {
            log.debug("AI skill similarity unavailable: {}", e.getMessage());
            return -1.0;
        }
    }

    /**
     * Calculate enhanced skill match using AI embeddings
     * Combines exact matching with semantic similarity
     *
     * @param userSkills Skills the user has
     * @param requiredSkills Skills required
     * @return Enhanced match score with AI understanding
     */
    public AISkillMatchResult calculateEnhancedMatch(Set<String> userSkills, Set<String> requiredSkills) {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return new AISkillMatchResult(1.0, 1.0, 1.0, true,
                    new ArrayList<>(userSkills), List.of());
        }

        try {
            String endpoint = mlServiceUrl + "/ml/skills/enhanced-match";

            Map<String, Object> request = new HashMap<>();
            request.put("user_skills", new ArrayList<>(userSkills));
            request.put("required_skills", new ArrayList<>(requiredSkills));
            request.put("similarity_threshold", 0.7);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.debug("Calling ML service for AI-powered skill matching...");

            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return parseAISkillMatchResponse(response.getBody());
            }

        } catch (Exception e) {
            log.debug("AI skill embedding service unavailable, using fallback: {}", e.getMessage());
        }

        // Fallback to basic matching
        return calculateBasicMatch(userSkills, requiredSkills);
    }

    /**
     * Parse response from Python ML service
     */
    @SuppressWarnings("unchecked")
    private AISkillMatchResult parseAISkillMatchResponse(Map<String, Object> responseBody) {
        double exactMatch = getDouble(responseBody, "exact_match_score");
        double similarityMatch = getDouble(responseBody, "similarity_match_score");
        double overallScore = getDouble(responseBody, "overall_score");

        List<String> matchedSkills = (List<String>) responseBody.getOrDefault("matched_skills", List.of());
        List<Map<String, Object>> similarSkills =
                (List<Map<String, Object>>) responseBody.getOrDefault("similar_skills", List.of());

        log.info("✅ AI-Enhanced Skill Match:");
        log.info("   Exact: {:.1f}%, Similarity: {:.1f}%, Overall: {:.1f}%",
                exactMatch * 100, similarityMatch * 100, overallScore * 100);

        if (!similarSkills.isEmpty()) {
            log.info("   Transferable skills found:");
            for (Map<String, Object> match : similarSkills) {
                log.info("     - {} ≈ {} ({:.0f}% similar)",
                        match.get("required"),
                        match.get("user_has"),
                        getDouble(match, "similarity") * 100);
            }
        }

        return new AISkillMatchResult(
                exactMatch,
                similarityMatch,
                overallScore,
                true, // AI-powered
                matchedSkills,
                similarSkills
        );
    }

    /**
     * Fallback to basic exact matching
     */
    private AISkillMatchResult calculateBasicMatch(Set<String> userSkills, Set<String> requiredSkills) {
        Set<String> userNorm = normalizeSkills(userSkills);
        Set<String> reqNorm = normalizeSkills(requiredSkills);

        List<String> matched = reqNorm.stream()
                .filter(userNorm::contains)
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);

        double exactMatch = (double) matched.size() / reqNorm.size();

        return new AISkillMatchResult(
                exactMatch,
                0.0,
                exactMatch,
                false, // Not AI-powered (fallback)
                matched,
                List.of()
        );
    }

    private Set<String> normalizeSkills(Set<String> skills) {
        Set<String> normalized = new HashSet<>();
        for (String skill : skills) {
            normalized.add(skill.toLowerCase().trim());
        }
        return normalized;
    }

    private double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }

    /**
     * Result of AI-enhanced skill matching
     */
    public static class AISkillMatchResult {
        public final double exactMatchScore;
        public final double similarityMatchScore;
        public final double overallScore;
        public final boolean usedAI;
        public final List<String> matchedSkills;
        public final List<Map<String, Object>> similarSkills;

        public AISkillMatchResult(
                double exactMatchScore,
                double similarityMatchScore,
                double overallScore,
                boolean usedAI,
                List<String> matchedSkills,
                List<Map<String, Object>> similarSkills) {
            this.exactMatchScore = exactMatchScore;
            this.similarityMatchScore = similarityMatchScore;
            this.overallScore = overallScore;
            this.usedAI = usedAI;
            this.matchedSkills = matchedSkills;
            this.similarSkills = similarSkills;
        }

        public String getExplanation() {
            if (!usedAI) {
                return String.format("Basic match: %.0f%% (AI unavailable)", exactMatchScore * 100);
            }

            StringBuilder exp = new StringBuilder();
            exp.append(String.format("AI-Enhanced Match: %.0f%%\n", overallScore * 100));
            exp.append(String.format("  Exact: %.0f%%, Transferable: %.0f%%\n",
                    exactMatchScore * 100, similarityMatchScore * 100));

            if (!matchedSkills.isEmpty()) {
                exp.append("  Perfect matches: ").append(String.join(", ", matchedSkills)).append("\n");
            }

            if (!similarSkills.isEmpty()) {
                exp.append("  Transferable skills:\n");
                for (Map<String, Object> match : similarSkills) {
                    exp.append(String.format("    - %s ≈ %s (%.0f%% similar)\n",
                            match.get("required"),
                            match.get("user_has"),
                            getDoubleFromMap(match, "similarity") * 100));
                }
            }

            return exp.toString();
        }

        private double getDoubleFromMap(Map<String, Object> map, String key) {
            Object value = map.get(key);
            return value instanceof Number ? ((Number) value).doubleValue() : 0.0;
        }
    }
}

