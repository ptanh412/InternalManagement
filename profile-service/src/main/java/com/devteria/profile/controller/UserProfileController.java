package com.devteria.profile.controller;

import com.devteria.profile.dto.ApiResponse;
import com.devteria.profile.dto.request.ProfileCreationRequest;
import com.devteria.profile.dto.request.SearchUserRequest;
import com.devteria.profile.dto.request.UpdateProfileRequest;
import com.devteria.profile.dto.response.UserProfileResponse;
import com.devteria.profile.entity.UserProfile;
import com.devteria.profile.service.UserProfileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

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

    @GetMapping("/users/debug/all")
    ApiResponse<List<String>> debugGetAllProfiles() {
        // Temporary debug endpoint - remove after fixing the issue
        try {
            List<UserProfile> profiles = userProfileService.getAllProfilesForDebug();
            List<String> debugInfo = profiles.stream()
                    .map(profile -> String.format("ID: %s, UserID: %s, Username: %s, Email: %s",
                            profile.getId(), profile.getUserId(), profile.getUsername(), profile.getEmail()))
                    .toList();
            return ApiResponse.<List<String>>builder()
                    .result(debugInfo)
                    .build();
        } catch (Exception e) {
            return ApiResponse.<List<String>>builder()
                    .code(1005)
                    .message("Debug error: " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/users/debug/userId/{userId}")
    ApiResponse<String> debugGetByUserId(@PathVariable String userId) {
        // Temporary debug endpoint
        try {
            UserProfileResponse profile = userProfileService.getByUserId(userId);
            return ApiResponse.<String>builder()
                    .result(String.format("Found profile - ID: %s, UserID: %s, Username: %s",
                            profile.getId(), profile.getUserId(), profile.getUsername()))
                    .build();
        } catch (Exception e) {
            return ApiResponse.<String>builder()
                    .code(1005)
                    .message("Debug: Profile not found for userId " + userId + " - " + e.getMessage())
                    .build();
        }
    }
}
