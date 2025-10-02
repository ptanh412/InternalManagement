package com.mnp.ai.mapper;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mnp.ai.dto.UserProfileResponse;
import com.mnp.ai.dto.UserSkillResponse;
import com.mnp.ai.model.UserProfile;

@Component
public class UserProfileMapper {

    public UserProfile fromUserProfileResponse(UserProfileResponse response) {
        if (response == null) {
            return null;
        }

        return UserProfile.builder()
                .userId(response.getUserId())
                .name(extractNameFromUser(response))
                .avatar(response.getAvatar())
                .dob(response.getDob())
                .city(response.getCity())
                .department(extractDepartmentFromUser(response))
                .role(extractRoleFromUser(response))
                .skills(convertSkillsToMap(
                        response.getSkills())) // Convert List<UserSkillResponse> to Map<String, Double>
                .skillTypes(response.getSkillTypes())
                .skillExperience(response.getSkillExperience())
                .certifications(response.getCertifications())
                .experienceYears(response.getExperienceYears())
                .averageTaskCompletionRate(response.getAverageTaskCompletionRate())
                .totalTasksCompleted(response.getTotalTasksCompleted())
                .currentWorkLoadHours(response.getCurrentWorkLoadHours())
                .availabilityStatus(response.getAvailabilityStatus())
                .performanceRating(response.getPerformanceRating())
                .averageTaskTime(response.getAverageTaskTime())
                .preferredTaskTypes(response.getPreferredTaskTypes())
                .preferredDepartments(response.getPreferredDepartments())
                .previousTaskIds(response.getPreviousTaskIds())
                .taskTypeSuccess(response.getTaskTypeSuccess())
                .createdAt(response.getCreatedAt())
                .updatedAt(response.getUpdatedAt())
                // Calculate AI-specific fields
                .workloadCapacity(calculateWorkloadCapacity(response))
                .availabilityScore(calculateAvailabilityScore(response))
                .collaborationHistory(new HashMap<>()) // Will be populated from other sources
                .build();
    }

    /**
     * Convert List<UserSkillResponse> to Map<String, Double> for AI processing
     */
    private Map<String, Double> convertSkillsToMap(java.util.List<UserSkillResponse> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            return new HashMap<>();
        }

        return skillsList.stream()
                .collect(Collectors.toMap(
                        skill -> skill.getSkillName().toLowerCase().trim(), // Normalize to lowercase
                        skill -> convertProficiencyToDouble(skill.getProficiencyLevel()),
                        (existing, replacement) -> existing // Handle duplicate keys by keeping the existing value
                        ));
    }

    /**
     * Convert proficiency level string to numeric value for AI calculations
     */
    private Double convertProficiencyToDouble(String proficiencyLevel) {
        if (proficiencyLevel == null) {
            return 1.0;
        }

        return switch (proficiencyLevel.toUpperCase()) {
            case "BEGINNER", "NOVICE" -> 1.0;
            case "INTERMEDIATE", "COMPETENT" -> 2.5;
            case "ADVANCED", "PROFICIENT" -> 4.0;
            case "EXPERT", "MASTER" -> 5.0;
            default -> 2.0; // Default to intermediate level
        };
    }

    /**
     * Extract name from UserResponse if available, fallback to userId
     */
    private String extractNameFromUser(UserProfileResponse response) {
        if (response.getUser() != null) {
            String firstName = response.getUser().getFirstName();
            String lastName = response.getUser().getLastName();
            if (firstName != null && lastName != null) {
                return firstName + " " + lastName;
            } else if (firstName != null) {
                return firstName;
            }
        }
        return response.getName() != null ? response.getName() : "User-" + response.getUserId();
    }

    /**
     * Extract department from UserResponse if available
     */
    private String extractDepartmentFromUser(UserProfileResponse response) {
        if (response.getUser() != null && response.getUser().getDepartmentName() != null) {
            return response.getUser().getDepartmentName();
        }
        return response.getDepartment() != null ? response.getDepartment() : "Unknown";
    }

    /**
     * Extract role from UserResponse if available
     */
    private String extractRoleFromUser(UserProfileResponse response) {
        if (response.getUser() != null && response.getUser().getRoleName() != null) {
            return response.getUser().getRoleName();
        }
        return response.getRole() != null ? response.getRole() : "USER";
    }

    private Double calculateWorkloadCapacity(UserProfileResponse response) {
        Integer currentHours = response.getCurrentWorkLoadHours();
        if (currentHours == null) return 0.5;

        // Assuming 40 hours per week as full capacity
        return Math.min(currentHours / 40.0, 1.0);
    }

    private Double calculateAvailabilityScore(UserProfileResponse response) {
        String status = response.getAvailabilityStatus();
        if ("AVAILABLE".equals(status)) {
            return 1.0;
        } else if ("BUSY".equals(status)) {
            return 0.5;
        } else {
            return 0.1;
        }
    }
}
