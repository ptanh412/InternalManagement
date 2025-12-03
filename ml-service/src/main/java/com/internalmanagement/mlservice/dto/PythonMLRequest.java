package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for Python ML Service (FastAPI model_server.py)
 * Matches the format expected by POST /recommend endpoint
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PythonMLRequest {

    private TaskProfile task;
    private List<Candidate> candidates;
    private Integer max_recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskProfile {
        private String task_id;
        private String title;
        private String description;
        private String priority;
        private String difficulty;
        private Double estimated_hours;
        private List<String> required_skills;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Candidate {
        private String user_id;
        private String email;
        private List<String> skills;
        private Double years_experience;
        private String seniority_level;
        private Double utilization;
        private Double performance_score;
        private String availability_status;
        private String department_name;  // Added for Python ML
        private Double capacity;  // Added for Python ML
    }
}

