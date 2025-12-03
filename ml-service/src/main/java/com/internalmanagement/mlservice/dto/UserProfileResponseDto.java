package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * User Profile Response DTO from Profile Service
 * Matches the structure of profile-service's UserProfileResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponseDto {
    private String id;
    private String userId;

    // User information from Identity Service
    private UserDto user;

    // Profile-specific data
    private String avatar;
    private LocalDate dob;
    private String city;
    private List<UserSkillResponseDto> skills;
    private String availabilityStatus;
    private Double averageTaskCompletionRate;
    private Integer totalTasksCompleted;
    private Integer currentWorkLoadHours;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /**
     * User data from identity-service
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDto {
        private String id;
        private String username;
        private String email;
        private boolean emailVerified;
        private String firstName;
        private String lastName;
        private String employeeId;
        private String phoneNumber;
        private Double performanceScore;
        private String roleName;
        private String roleDescription;
        private String departmentName;  // This is what we need!
        private String positionTitle;
        private String seniorityLevel;
        private boolean isActive;
        private boolean online;
        private LocalDateTime lastLogin;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    /**
     * User skill response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserSkillResponseDto {
        private String id;
        private String skillName;
        private String proficiencyLevel;
        private Integer yearsOfExperience;
    }
}

