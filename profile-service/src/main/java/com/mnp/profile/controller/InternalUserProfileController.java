package com.mnp.profile.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.profile.dto.request.ProfileCreationRequest;
import com.mnp.profile.dto.response.UserProfileResponse;
import com.mnp.profile.mapper.InterServiceMapper;
import com.mnp.profile.service.UserProfileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InternalUserProfileController {
    UserProfileService userProfileService;
    InterServiceMapper interServiceMapper;

    @PostMapping("/internal/users")
    ApiResponse<UserProfileResponse> createProfile(@RequestBody ProfileCreationRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.createProfile(request))
                .build();
    }

    @PostMapping("/internal/users/inter-service")
    ApiResponse<UserProfileResponse> createProfileInterService(
            @RequestBody InterServiceProfileCreationRequest request) {
        log.info("Creating profile via inter-service communication for userId: {}", request.getUserId());

        // Convert inter-service request to internal request
        ProfileCreationRequest internalRequest = interServiceMapper.toProfileCreationRequest(request);

        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.createProfile(internalRequest))
                .build();
    }

    @GetMapping("/internal/users/{userId}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String userId) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.getByUserId(userId))
                .build();
    }

    // New endpoints for AI service compatibility
    @GetMapping("/internal/profiles/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(@PathVariable String userId) {
        log.info("Getting user profile for userId: {}", userId);
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.getByUserId(userId))
                .build();
    }

    @GetMapping("/internal/profiles/available")
    ApiResponse<List<UserProfileResponse>> getAllAvailableUsers() {
        log.info("Getting all available users");
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getAllAvailableUsers())
                .build();
    }

    @GetMapping("/internal/profiles/all")
    ApiResponse<List<UserProfileResponse>> getAllUsers() {
        log.info("Getting all users");
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getAllUsers())
                .build();
    }

    @GetMapping("/internal/profiles/team/{teamId}")
    ApiResponse<List<UserProfileResponse>> getTeamMembers(@PathVariable String teamId) {
        log.info("Getting team members for teamId: {}", teamId);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getTeamMembers(teamId))
                .build();
    }

    @GetMapping("/internal/profiles/department/{department}")
    ApiResponse<List<UserProfileResponse>> getUsersByDepartment(@PathVariable String department) {
        log.info("Getting users by department: {}", department);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getUsersByDepartment(department))
                .build();
    }

    @GetMapping("/internal/profiles/skills")
    ApiResponse<List<UserProfileResponse>> getUsersBySkills(@RequestParam List<String> skills) {
        log.info("Getting users by skills: {}", skills);
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getUsersBySkills(skills))
                .build();
    }
}
