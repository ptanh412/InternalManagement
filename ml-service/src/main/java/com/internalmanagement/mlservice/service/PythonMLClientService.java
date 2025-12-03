package com.internalmanagement.mlservice.service;

import com.internalmanagement.mlservice.dto.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calling Python ML model (FastAPI model_server.py)
 * This provides REAL ML predictions using trained Random Forest + SVD models
 */
@Service
@Slf4j

public class PythonMLClientService {

    private final RestTemplate restTemplate;
    private final String pythonMLUrl;

    public PythonMLClientService(
            RestTemplate restTemplate,
            @Value("${ml.python.url:http://localhost:8000}") String pythonMLUrl) {
        this.restTemplate = restTemplate;
        this.pythonMLUrl = pythonMLUrl;
        log.info("Python ML Client initialized with URL: {}", pythonMLUrl);
    }

    /**
     * Get ML recommendations from Python FastAPI service
     */
    public List<RecommendationItemDto> getPythonMLRecommendations(
            TaskDetailsDto task,
            List<CandidateProfileDto> candidates) {

        String endpoint = pythonMLUrl + "/recommend";

        log.info("==================================================");
        log.info("Calling Python ML Service");
        log.info("==================================================");
        log.info("Endpoint: {}", endpoint);
        log.info("Task: {} ({})", task.getTaskId(), task.getTitle());
        log.info("Candidates: {}", candidates.size());

        try {
            // Build request for Python ML model
            PythonMLRequest request = buildPythonMLRequest(task, candidates);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PythonMLRequest> entity = new HttpEntity<>(request, headers);

            // Call Python FastAPI - Python returns List directly, not wrapped in Map
            long startTime = System.currentTimeMillis();

            ResponseEntity<List> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    List.class
            );

            long duration = System.currentTimeMillis() - startTime;

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> pythonRecommendations = (List<Map<String, Object>>) response.getBody();

                log.info("✅ Python ML Service Response:");
                log.info("   Status: {}", response.getStatusCode());
                log.info("   Duration: {}ms", duration);
                log.info("   Received {} recommendations", pythonRecommendations.size());

                List<RecommendationItemDto> recommendations = convertPythonMLResponseList(pythonRecommendations);

                log.info("✅ Successfully converted {} ML recommendations from Python", recommendations.size());
                log.info("==================================================");

                return recommendations;
            }

            log.warn("Python ML returned non-200 status: {}", response.getStatusCode());

        } catch (RestClientException e) {
            log.error("❌ Failed to call Python ML service: {}", e.getMessage());
            log.error("   Endpoint: {}", endpoint);
            log.error("   Make sure Python service is running: python src/api/model_server.py");
        } catch (Exception e) {
            log.error("❌ Unexpected error calling Python ML: {}", e.getMessage(), e);
        }

        log.info("==================================================");
        return new ArrayList<>();
    }

    /**
     * Check if Python ML service is available
     */
    public boolean isPythonMLAvailable() {
        try {
            String healthEndpoint = pythonMLUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(healthEndpoint, String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (Exception e) {
            log.debug("Python ML service not available: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Build request for Python ML model
     */
    private PythonMLRequest buildPythonMLRequest(TaskDetailsDto task, List<CandidateProfileDto> candidates) {
        // Map task
        PythonMLRequest.TaskProfile taskProfile = PythonMLRequest.TaskProfile.builder()
                .task_id(task.getTaskId())
                .title(task.getTitle())
                .description(task.getDescription())
                .priority(task.getPriority())
                .difficulty(task.getDifficulty())
                .estimated_hours(task.getEstimatedHours())
                .required_skills(task.getRequiredSkills())
                .build();

        // Map candidates
        List<PythonMLRequest.Candidate> pythonCandidates = candidates.stream()
                .map(this::mapCandidate)
                .collect(Collectors.toList());

        return PythonMLRequest.builder()
                .task(taskProfile)
                .candidates(pythonCandidates)
                .max_recommendations(10)
                .build();
    }

    /**
     * Map candidate to Python format
     */
    private PythonMLRequest.Candidate mapCandidate(CandidateProfileDto candidate) {
        log.debug("Mapping candidate {} to Python format", candidate.getUserId());

        // Use REAL department name from identity-service (via profile-service)
        String departmentName = candidate.getDepartmentName();

        // Fallback to "Unknown" if department is null
        if (departmentName == null || departmentName.isEmpty()) {
            departmentName = "Unknown";
            log.warn("  ⚠️ Department name is null for candidate {}, using 'Unknown'", candidate.getUserId());
        } else {
            log.debug("  ✓ Using real department: {}", departmentName);
        }

        return PythonMLRequest.Candidate.builder()
                .user_id(candidate.getUserId())
                .email(candidate.getEmail())
                .skills(candidate.getSkills() != null ? new ArrayList<>(candidate.getSkills()) : new ArrayList<>())
                .years_experience(candidate.getYearsExperience())
                .seniority_level(candidate.getSeniorityLevel())
                .utilization(candidate.getUtilization())
                .performance_score(candidate.getPerformanceScore())
                .availability_status(candidate.getAvailabilityStatus())
                .department_name(departmentName)  // REAL department from identity-service!
                .capacity(40.0) // Default capacity
                .build();
    }

    /**
     * Convert Python ML response list to RecommendationItemDto list
     * Python returns List[RecommendationResponse] directly
     */
    private List<RecommendationItemDto> convertPythonMLResponseList(List<Map<String, Object>> pythonRecommendations) {
        try {
            if (pythonRecommendations == null || pythonRecommendations.isEmpty()) {
                log.warn("Python ML returned empty recommendations");
                return new ArrayList<>();
            }

            log.info("=== PYTHON ML PREDICTIONS ===");
            List<RecommendationItemDto> recommendations = new ArrayList<>();

            for (int i = 0; i < pythonRecommendations.size(); i++) {
                Map<String, Object> rec = pythonRecommendations.get(i);

                log.info("PYTHON_ML[{}] - UserID: {}, Email: {}, Confidence: {}",
                        i + 1,
                        rec.get("user_id"),
                        rec.get("email"),
                        rec.get("confidence_score"));

                RecommendationItemDto item = convertToRecommendationItem(rec);
                recommendations.add(item);
            }

            log.info("=============================");
            log.info("Converted {} Python ML recommendations to DTOs", recommendations.size());

            return recommendations;

        } catch (Exception e) {
            log.error("Error converting Python ML response: {}", e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Convert Python ML prediction to RecommendationItemDto
     */
    @SuppressWarnings("unchecked")
    private RecommendationItemDto convertToRecommendationItem(Map<String, Object> prediction) {
        Map<String, Object> reasoning = (Map<String, Object>) prediction.get("reasoning");

        return RecommendationItemDto.builder()
                .userId(getString(prediction, "user_id"))
                .userName(null) // Will be filled by service layer
                .userEmail(getString(prediction, "email"))
                .score(getDouble(prediction, "confidence_score"))
                .rank(getInteger(prediction, "rank"))
                .reason(reasoning != null ? getString(reasoning, "explanation") : "ML model recommendation")
                .skillMatchScore(reasoning != null ? getDouble(reasoning, "skill_match_score") : 0.0)
                .performanceScore(reasoning != null ? getDouble(reasoning, "experience_score") : 0.0)
                .availabilityScore(0.0) // Python model doesn't return this
                .workloadScore(reasoning != null ? getDouble(reasoning, "workload_score") : 0.0)
                .matchedSkills(new ArrayList<>()) // Will be calculated by service layer
                .missingSkills(new ArrayList<>())
                .build();
    }

    // Helper methods
    private String getString(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Double getDouble(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return 0.0;
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private Integer getInteger(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value == null) return 0;
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}

