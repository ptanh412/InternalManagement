package com.mnp.ai.mapper;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mnp.ai.client.WorkloadServiceClient;
import com.mnp.ai.dto.ApiResponse;
import com.mnp.ai.dto.UserAvailabilityResponse;
import com.mnp.ai.dto.UserProfileResponse;
import com.mnp.ai.dto.UserSkillResponse;
import com.mnp.ai.dto.UserWorkloadResponse;
import com.mnp.ai.model.UserProfile;
import com.mnp.ai.service.SkillNormalizer;

@Component
public class UserProfileMapper {

    private final WorkloadServiceClient workloadServiceClient;
    private final SkillNormalizer skillNormalizer;

    public UserProfileMapper(
            WorkloadServiceClient workloadServiceClient,
            SkillNormalizer skillNormalizer) {
        this.workloadServiceClient = workloadServiceClient;
        this.skillNormalizer = skillNormalizer;
    }

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
                .seniorityLevel(extractSeniorityLevelFromUser(response)) // Extract from identity-service

                // Skills from profile-service
                .skills(convertSkillsToMap(response.getSkills()))
                .skillTypes(generateSkillTypesFromSkills(response.getSkills()))
                .skillExperience(generateSkillExperienceFromSkills(response.getSkills()))

                // Performance data from profile-service
                .averageTaskCompletionRate(response.getAverageTaskCompletionRate())
                .totalTasksCompleted(response.getTotalTasksCompleted())
                .currentWorkLoadHours(response.getCurrentWorkLoadHours())
                .availabilityStatus(response.getAvailabilityStatus())

                // AI-specific fields - provide defaults since they're not in profile-service
                .certifications(new ArrayList<>()) // Default empty list
                .experienceYears(calculateExperienceFromSkills(response.getSkills())) // Infer from skills
                .performanceRating(calculatePerformanceRating(response)) // Calculate from completion rate
                .averageTaskTime(calculateAverageTaskTime(response)) // Default based on performance
                .preferredTaskTypes(new ArrayList<>()) // Default empty - could be learned
                .preferredDepartments(new ArrayList<>()) // Default empty - could be learned
                .previousTaskIds(new ArrayList<>()) // Default empty - would come from task history
                .taskTypeSuccess(new HashMap<>()) // Default empty - would be calculated from history

                // Timestamps from profile-service
                .createdAt(response.getCreatedAt())
                .updatedAt(response.getUpdatedAt())

                // Calculate derived AI-specific fields with workload integration
                .workloadCapacity(calculateWorkloadCapacity(response))
                .availabilityScore(calculateAvailabilityScore(response))
                .collaborationHistory(new HashMap<>()) // Will be populated from other sources
                .build();
    }

    /**
     * Convert List<UserSkillResponse> to Map<String, Double> for AI processing
     */
    private Map<String, Double> convertSkillsToMap(List<UserSkillResponse> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            return new HashMap<>();
        }

        return skillsList.stream()
                .collect(Collectors.toMap(
                        skill -> normalizeSkillKey(skill.getSkillName()), // Normalize skill key
                        skill -> convertProficiencyToDouble(skill.getProficiencyLevel()),
                        Math::max // Keep higher proficiency
                ));
    }

    private String normalizeSkillKey(String rawSkill) {
        if (rawSkill == null) return "";
        String normalized = skillNormalizer.normalizeSkill(rawSkill);
        return normalized.toLowerCase().trim();
    }

    /**
     * Generate skill types map from skills list
     */
    private Map<String, String> generateSkillTypesFromSkills(List<UserSkillResponse> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            return new HashMap<>();
        }

        return skillsList.stream()
                .collect(Collectors.toMap(
                        skill -> normalizeSkillKey(skill.getSkillName()),
                        skill -> skill.getSkillType() != null ? skill.getSkillType() : "TECHNICAL",
                        (existing, replacement) -> existing));
    }

    /**
     * Generate skill experience map from skills list
     */
    private Map<String, Integer> generateSkillExperienceFromSkills(List<UserSkillResponse> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            return new HashMap<>();
        }

        return skillsList.stream()
                .collect(Collectors.toMap(
                        skill -> normalizeSkillKey(skill.getSkillName()),
                        skill -> skill.getYearsOfExperience() != null ? skill.getYearsOfExperience() : 1,
                        Math::max));
    }

    /**
     * Calculate experience years from skills (average or max)
     */
    private Double calculateExperienceFromSkills(List<UserSkillResponse> skillsList) {
        if (skillsList == null || skillsList.isEmpty()) {
            return 1.0; // Default 1 year experience
        }

        double avgExperience = skillsList.stream()
                .mapToInt(skill -> skill.getYearsOfExperience() != null ? skill.getYearsOfExperience() : 1)
                .average()
                .orElse(1.0);

        return Math.max(1.0, avgExperience);
    }

    /**
     * Get performance score from identity service (via profile service)
     * Performance score is stored on 0-100 scale in identity database
     */
    private Double calculatePerformanceRating(UserProfileResponse response) {
        // Try to get performanceScore from user data (from identity-service)
        if (response.getUser() != null && response.getUser().getPerformanceScore() != null) {
            // Return the actual performance score from identity DB (0-100 scale)
            // Convert to 0-5 scale for backward compatibility with existing code
            return response.getUser().getPerformanceScore() / 20.0; // 0-100 → 0-5
        }

        // Fallback: calculate from completion rate if performanceScore not available
        Double completionRate = response.getAverageTaskCompletionRate();
        if (completionRate == null) {
            return 3.0; // Default rating
        }

        // Convert completion rate (0-1) to rating (1-5)
        return Math.max(1.0, Math.min(5.0, completionRate * 5.0));
    }

    /**
     * Calculate average task time based on performance
     */
    private Double calculateAverageTaskTime(UserProfileResponse response) {
        Double completionRate = response.getAverageTaskCompletionRate();
        if (completionRate == null) {
            return 8.0; // Default 8 hours
        }

        // Higher completion rate = faster task completion (inverse relationship)
        // Range: 4-16 hours based on completion rate
        return Math.max(4.0, 16.0 - (completionRate * 12.0));
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
        return "User-" + response.getUserId();
    }

    /**
     * Extract department from UserResponse if available
     */
    private String extractDepartmentFromUser(UserProfileResponse response) {
        if (response.getUser() != null && response.getUser().getDepartmentName() != null) {
            return response.getUser().getDepartmentName();
        }
        return "Unknown";
    }

    /**
     * Extract role from UserResponse if available
     */
    private String extractRoleFromUser(UserProfileResponse response) {
        if (response.getUser() != null && response.getUser().getRoleName() != null) {
            return response.getUser().getRoleName();
        }
        return "USER";
    }

    /**
     * Extract seniority level from UserResponse if available
     */
    private String extractSeniorityLevelFromUser(UserProfileResponse response) {
        if (response.getUser() != null && response.getUser().getSeniorityLevel() != null) {
            return response.getUser().getSeniorityLevel();
        }
        // Fallback: try to infer from experienceYears if available
        return "MID_LEVEL"; // Default to mid-level
    }

    /**
     * Calculate workload capacity using real workload data from workload-service
     */
    private Double calculateWorkloadCapacity(UserProfileResponse response) {
        try {
            // Try to get real-time workload data
            ApiResponse<UserWorkloadResponse> workloadResponse =
                    workloadServiceClient.getUserWorkload(response.getUserId());

            if (workloadResponse != null && workloadResponse.getResult() != null) {
                UserWorkloadResponse workload = workloadResponse.getResult();

                // Calculate capacity based on utilization percentage
                Double utilizationPercentage = workload.getUtilizationPercentage();
                if (utilizationPercentage != null) {
                    // Convert utilization to capacity (0-1 scale)
                    return Math.max(0.0, Math.min(1.0, utilizationPercentage / 100.0));
                }
            }
        } catch (Exception e) {
            // Fallback if workload service is unavailable
            System.err.println("Failed to get workload data for user " + response.getUserId() + ": " + e.getMessage());
        }

        // Fallback calculation using profile data
        Integer currentHours = response.getCurrentWorkLoadHours();
        if (currentHours == null) return 0.5;

        // Assuming 40 hours per week as full capacity
        return Math.min(currentHours / 40.0, 1.0);
    }

    /**
     * Calculate availability score using real workload data from workload-service
     */
    private Double calculateAvailabilityScore(UserProfileResponse response) {
        try {
            // Try to get real-time availability data
            ApiResponse<UserAvailabilityResponse> availabilityResponse =
                    workloadServiceClient.getUserAvailability(response.getUserId());

            if (availabilityResponse != null && availabilityResponse.getResult() != null) {
                UserAvailabilityResponse availability = availabilityResponse.getResult();

                // Use availability percentage from workload service
                Double availabilityPercentage = availability.getAvailabilityPercentage();
                if (availabilityPercentage != null) {
                    return Math.max(0.0, Math.min(1.0, availabilityPercentage / 100.0));
                }

                // Fallback to boolean availability
                Boolean isAvailable = availability.getIsAvailable();
                if (isAvailable != null) {
                    return isAvailable ? 0.8 : 0.2;
                }
            }
        } catch (Exception e) {
            // Fallback if workload service is unavailable
            System.err.println(
                    "Failed to get availability data for user " + response.getUserId() + ": " + e.getMessage());
        }

        // Fallback calculation using profile availability status
        String status = response.getAvailabilityStatus();
        if (status != null) {
            return switch (status.toUpperCase()) {
                case "AVAILABLE" -> 0.9;
                case "BUSY" -> 0.4;
                case "UNAVAILABLE" -> 0.1;
                default -> 0.5;
            };
        }

        return 0.5; // Default neutral score
    }
}
