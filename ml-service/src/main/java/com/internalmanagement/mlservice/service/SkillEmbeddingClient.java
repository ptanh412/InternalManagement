package com.internalmanagement.mlservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Python Skill Embedding Service Client
 *
 * Calls Python ML service to get AI-powered skill similarities
 * using sentence transformers (e.g., knows "Rust" is similar to "C++")
 */
@Service
@Slf4j
public class SkillEmbeddingClient {

    private final RestTemplate restTemplate;
    private final String pythonMLUrl;

    public SkillEmbeddingClient(
            RestTemplate restTemplate,
            @Value("${ml.python.url:http://localhost:8000}") String pythonMLUrl) {
        this.restTemplate = restTemplate;
        this.pythonMLUrl = pythonMLUrl;
    }

    /**
     * Calculate semantic similarity between two skills
     *
     * @param skill1 First skill
     * @param skill2 Second skill
     * @return Similarity score (0.0 to 1.0)
     */
    public double calculateSimilarity(String skill1, String skill2) {
        try {
            String endpoint = pythonMLUrl + "/skills/similarity";

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
                    return ((Number) similarity).doubleValue();
                }
            }

            return 0.0;

        } catch (Exception e) {
            log.warn("Failed to calculate skill similarity via Python ML: {}", e.getMessage());
            return 0.0; // Fallback to 0 if service unavailable
        }
    }

    /**
     * Find most similar skills from a list of candidates
     *
     * @param targetSkill Target skill to match
     * @param candidateSkills List of candidate skills
     * @param topK Number of top results
     * @return List of (skill, similarity) pairs
     */
    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> findSimilarSkills(
            String targetSkill,
            List<String> candidateSkills,
            int topK) {

        try {
            String endpoint = pythonMLUrl + "/skills/find-similar";

            Map<String, Object> request = new HashMap<>();
            request.put("target_skill", targetSkill);
            request.put("candidate_skills", candidateSkills);
            request.put("top_k", topK);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Object similarSkills = response.getBody().get("similar_skills");
                if (similarSkills instanceof List) {
                    return (List<Map<String, Object>>) similarSkills;
                }
            }

            return List.of();

        } catch (Exception e) {
            log.warn("Failed to find similar skills via Python ML: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Calculate enhanced skill match using AI embeddings
     *
     * @param userSkills Skills the user has
     * @param requiredSkills Skills required for the task
     * @param similarityThreshold Minimum similarity to consider a match (0-1)
     * @return Enhanced match result with scores and explanations
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> calculateEnhancedMatch(
            List<String> userSkills,
            List<String> requiredSkills,
            double similarityThreshold) {

        try {
            String endpoint = pythonMLUrl + "/skills/enhanced-match";

            Map<String, Object> request = new HashMap<>();
            request.put("user_skills", userSkills);
            request.put("required_skills", requiredSkills);
            request.put("similarity_threshold", similarityThreshold);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);

            log.info("Calling Python ML for enhanced skill matching...");
            log.debug("  User skills: {}", userSkills);
            log.debug("  Required skills: {}", requiredSkills);

            ResponseEntity<Map> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> result = response.getBody();

                log.info("✅ Enhanced match result:");
                log.info("  Exact match: {}", result.get("exact_match_score"));
                log.info("  Similarity match: {}", result.get("similarity_match_score"));
                log.info("  Overall score: {}", result.get("overall_score"));

                return result;
            }

            return createFallbackResult(userSkills, requiredSkills);

        } catch (Exception e) {
            log.warn("Failed to calculate enhanced match via Python ML: {}", e.getMessage());
            return createFallbackResult(userSkills, requiredSkills);
        }
    }

    /**
     * Create fallback result when Python service is unavailable
     */
    private Map<String, Object> createFallbackResult(List<String> userSkills, List<String> requiredSkills) {
        // Simple exact matching fallback
        long exactMatches = requiredSkills.stream()
                .filter(req -> userSkills.stream()
                        .anyMatch(user -> user.equalsIgnoreCase(req)))
                .count();

        double exactMatchScore = requiredSkills.isEmpty() ?
                1.0 : (double) exactMatches / requiredSkills.size();

        Map<String, Object> fallback = new HashMap<>();
        fallback.put("exact_match_score", exactMatchScore);
        fallback.put("similarity_match_score", 0.0);
        fallback.put("overall_score", exactMatchScore * 0.6); // Conservative fallback
        fallback.put("matched_skills", List.of());
        fallback.put("similar_skills", List.of());
        fallback.put("explanation", "Fallback matching (Python ML service unavailable)");

        return fallback;
    }

    /**
     * Check if Python ML service with skill embeddings is available
     */
    public boolean isSkillEmbeddingServiceAvailable() {
        try {
            String endpoint = pythonMLUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(endpoint, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            return false;
        }
    }
}

