package com.mnp.ai.dto;

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
public class UserProfileResponse {
    String id;
    String userId;

    // User data from identity-service (wrapped object)
    UserResponse user;

    // Profile-specific data - matching profile service structure
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillResponse> skills; // Changed from Map<String, Double> to List<UserSkillResponse>
    String availabilityStatus; // Changed from enum to String for simplicity
    Double averageTaskCompletionRate;
    Integer totalTasksCompleted;
    Integer currentWorkLoadHours;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    // Additional fields that might be used by AI (these will be null from profile service)
    String name;
    String department;
    String role;
    Map<String, String> skillTypes;
    Map<String, Integer> skillExperience;
    List<String> certifications;
    Double experienceYears;
    Double performanceRating;
    Double averageTaskTime;
    List<String> preferredTaskTypes;
    List<String> preferredDepartments;
    List<String> previousTaskIds;
    Map<String, Double> taskTypeSuccess;
}
