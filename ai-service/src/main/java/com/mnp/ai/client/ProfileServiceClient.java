package com.mnp.ai.client;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import com.mnp.ai.dto.ApiResponse;
import com.mnp.ai.dto.UserProfileResponse;

@FeignClient(
        name = "profile-service",
        url = "${app.services.profile:http://localhost:8081/profile}",
        fallback = ProfileServiceFallback.class)
public interface ProfileServiceClient {

    @GetMapping("/internal/profiles/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(@PathVariable String userId);

    @GetMapping("/internal/profiles/available")
    ApiResponse<List<UserProfileResponse>> getAllAvailableUsers();

    @GetMapping("/internal/profiles/all")
    ApiResponse<List<UserProfileResponse>> getAllUsers();

    @GetMapping("/internal/profiles/team/{teamId}")
    ApiResponse<List<UserProfileResponse>> getTeamMembers(@PathVariable String teamId);

    @GetMapping("/internal/profiles/department/{department}")
    ApiResponse<List<UserProfileResponse>> getUsersByDepartment(@PathVariable String department);

    @GetMapping("/internal/profiles/skills")
    ApiResponse<List<UserProfileResponse>> getUsersBySkills(@RequestParam List<String> skills);
}
