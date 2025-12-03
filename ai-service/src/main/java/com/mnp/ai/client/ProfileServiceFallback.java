package com.mnp.ai.client;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mnp.ai.dto.ApiResponse;
import com.mnp.ai.dto.UserProfileResponse;
import com.mnp.ai.dto.UserSkillResponse;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class ProfileServiceFallback implements ProfileServiceClient {

    @Override
    public ApiResponse<UserProfileResponse> getUserProfile(String userId) {
        log.warn("Profile service is unavailable, returning fallback for userId: {}", userId);
        return ApiResponse.<UserProfileResponse>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(createFallbackUserProfile(userId))
                .build();
    }

    @Override
    public ApiResponse<List<UserProfileResponse>> getAllAvailableUsers() {
        log.warn("Profile service is unavailable, returning empty available users list");
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(Collections.emptyList())
                .build();
    }

    @Override
    public ApiResponse<List<UserProfileResponse>> getAllUsers() {
        log.warn("Profile service is unavailable, returning empty users list");
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(Collections.emptyList())
                .build();
    }

    @Override
    public ApiResponse<List<UserProfileResponse>> getTeamMembers(String teamId) {
        log.warn("Profile service is unavailable, returning empty team members list for teamId: {}", teamId);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(Collections.emptyList())
                .build();
    }

    @Override
    public ApiResponse<List<UserProfileResponse>> getUsersByDepartment(String department) {
        log.warn("Profile service is unavailable, returning empty users list for department: {}", department);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(Collections.emptyList())
                .build();
    }

    @Override
    public ApiResponse<List<UserProfileResponse>> getUsersBySkills(List<String> skills) {
        log.warn("Profile service is unavailable, returning empty users list for skills: {}", skills);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .code(9999)
                .message("Profile service unavailable")
                .result(Collections.emptyList())
                .build();
    }

    private UserProfileResponse createFallbackUserProfile(String userId) {
        return UserProfileResponse.builder()
                .userId(userId)
                .skills(createFallbackSkills()) // Changed to use List<UserSkillResponse>
                .averageTaskCompletionRate(0.8)
                .totalTasksCompleted(50)
                .currentWorkLoadHours(20)
                .availabilityStatus("AVAILABLE")
                .createdAt(LocalDateTime.now())
                .build();
    }

    private List<UserSkillResponse> createFallbackSkills() {
        return List.of(
                UserSkillResponse.builder()
                        .skillName("Java")
                        .skillType("TECHNICAL")
                        .proficiencyLevel("INTERMEDIATE")
                        .yearsOfExperience(3)
                        .lastUsed(LocalDate.now().minusMonths(1))
                        .build(),
                UserSkillResponse.builder()
                        .skillName("Spring Boot")
                        .skillType("TECHNICAL")
                        .proficiencyLevel("INTERMEDIATE")
                        .yearsOfExperience(2)
                        .lastUsed(LocalDate.now().minusWeeks(1))
                        .build());
    }
}
