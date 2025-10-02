package com.mnp.profile.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.request.ProfileCreationRequest;
import com.mnp.profile.dto.request.SearchUserRequest;
import com.mnp.profile.dto.request.UpdateProfileRequest;
import com.mnp.profile.dto.response.UserProfileResponse;
import com.mnp.profile.service.UserProfileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserProfileController {
    UserProfileService userProfileService;

    @PostMapping("/users")
    ApiResponse<UserProfileResponse> createProfile(@RequestBody ProfileCreationRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.createProfile(request))
                .build();
    }

    @GetMapping("/users/{profileId}")
    ApiResponse<UserProfileResponse> getProfile(@PathVariable String profileId) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.getProfile(profileId))
                .build();
    }

    @GetMapping("/users")
    ApiResponse<List<UserProfileResponse>> getAllProfiles() {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getAllProfiles())
                .build();
    }

    @GetMapping("/users/my-profile")
    ApiResponse<UserProfileResponse> getMyProfile() {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.getMyProfile())
                .build();
    }

    @PutMapping("/users/my-profile")
    ApiResponse<UserProfileResponse> updateMyProfile(@RequestBody UpdateProfileRequest request) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.updateMyProfile(request))
                .build();
    }

    @PutMapping("/users/avatar")
    ApiResponse<UserProfileResponse> updateAvatar(@RequestParam("file") MultipartFile file) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.updateAvatar(file))
                .build();
    }

    @PostMapping("/users/search")
    ApiResponse<List<UserProfileResponse>> search(@RequestBody SearchUserRequest request) {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.search(request))
                .build();
    }

    // AI Assignment System Endpoints
    @GetMapping("/api/profiles/skills")
    ApiResponse<List<UserProfileResponse>> getCandidatesBySkills(@RequestParam("skills") List<String> requiredSkills) {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getCandidatesBySkills(requiredSkills))
                .build();
    }

    @GetMapping("/api/profiles/available")
    ApiResponse<List<UserProfileResponse>> getAvailableCandidates() {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getAvailableCandidates())
                .build();
    }

    @GetMapping("/api/profiles/department/{department}")
    ApiResponse<List<UserProfileResponse>> getCandidatesByDepartment(@PathVariable String department) {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getCandidatesByDepartment(department))
                .build();
    }

    @GetMapping("/api/profiles/workload")
    ApiResponse<List<UserProfileResponse>> getCandidatesByWorkload(@RequestParam("maxWorkload") Double maxWorkload) {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getCandidatesByWorkload(maxWorkload))
                .build();
    }

    @GetMapping("/api/profiles/performance")
    ApiResponse<List<UserProfileResponse>> getCandidatesByPerformance(@RequestParam("minRating") Double minRating) {
        return ApiResponse.<List<UserProfileResponse>>builder()
                .result(userProfileService.getCandidatesByPerformance(minRating))
                .build();
    }

    @GetMapping("/api/profiles/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(@PathVariable String userId) {
        return ApiResponse.<UserProfileResponse>builder()
                .result(userProfileService.getByUserId(userId))
                .build();
    }
}
