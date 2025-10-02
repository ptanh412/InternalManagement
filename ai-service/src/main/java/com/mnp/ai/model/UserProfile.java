package com.mnp.ai.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfile {
    // Core fields aligned with profile-service entity
    String userId; // Reference to User entity in identity-service
    String name;
    String avatar;
    LocalDate dob;
    String city;
    String department;
    String role;

    // Skills and competencies - aligned with profile-service structure
    Map<String, Double> skills; // skill -> proficiency level (0-1)
    Map<String, String> skillTypes; // skill -> type (TECHNICAL, SOFT, DOMAIN)
    Map<String, Integer> skillExperience; // skill -> years of experience
    List<String> certifications;
    Double experienceYears;

    // Performance and workload metrics - aligned with profile-service
    Double averageTaskCompletionRate; // 0-1, aligned with profile-service
    Integer totalTasksCompleted; // aligned with profile-service
    Integer currentWorkLoadHours; // aligned with profile-service
    String availabilityStatus; // AVAILABLE, BUSY, UNAVAILABLE

    // AI/ML specific performance metrics
    Double performanceRating; // 0-5 scale
    Double averageTaskTime; // in hours
    Double workloadCapacity; // 0-1 (1 = full capacity)
    Double availabilityScore; // 0-1 (1 = fully available)

    // Preference and collaboration for AI recommendations
    List<String> preferredTaskTypes;
    List<String> preferredDepartments;
    Map<String, Double> collaborationHistory; // userId -> collaboration score

    // Historical assignment data for AI algorithms
    List<String> previousTaskIds;
    Map<String, Double> taskTypeSuccess; // taskType -> success rate

    // Timestamps aligned with profile-service
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Methods to fix compilation errors in HybridRecommendationAlgorithm
    public Double getTaskCompletionRate() {
        return averageTaskCompletionRate != null ? averageTaskCompletionRate : 0.0;
    }

    public Map<String, Double> getTaskTypeSuccessRates() {
        return taskTypeSuccess;
    }

    public Double getAverageTaskCompletionRate() {
        return averageTaskCompletionRate != null ? averageTaskCompletionRate : 0.0;
    }
}
