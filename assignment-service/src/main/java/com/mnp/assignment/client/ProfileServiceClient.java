package com.mnp.assignment.client;

import com.mnp.assignment.configuration.FeignClientConfiguration;
import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.response.UserProfileResponse;
import com.mnp.assignment.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient(name = "profile-service", url = "${app.services.profile}", configuration = FeignClientConfiguration.class)
public interface ProfileServiceClient {

    @GetMapping("/internal/profiles/{userId}")
    ApiResponse<UserProfileResponse> getUserProfile(@PathVariable String userId);

    @GetMapping("/internal/profiles/user/{userId}")
    ApiResponse<UserResponse> getUserDetails(@PathVariable String userId);

    @GetMapping("/internal/profiles/batch")
    ApiResponse<List<UserProfileResponse>> getUserProfiles(@RequestParam List<String> userIds);

    @GetMapping("/internal/profiles/available")
    ApiResponse<List<UserProfileResponse>> getAvailableUsers();

    @GetMapping("/internal/profiles/department/{departmentId}")
    ApiResponse<List<UserProfileResponse>> getUsersByDepartment(@PathVariable String departmentId);

    @GetMapping("/internal/profiles/skills")
    ApiResponse<List<UserProfileResponse>> getUsersBySkills(@RequestParam List<String> skills);

    @GetMapping("/internal/profiles/{userId}/workload")
    ApiResponse<Integer> getUserCurrentWorkload(@PathVariable String userId);

    @GetMapping("/internal/profiles/{userId}/performance")
    ApiResponse<Double> getUserPerformanceScore(@PathVariable String userId);
}
