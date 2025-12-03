package com.internalmanagement.mlservice.client;

import com.internalmanagement.mlservice.config.AuthenticationRequestInterceptor;
import com.internalmanagement.mlservice.dto.UserProfileResponseDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

import java.util.List;

/**
 * Feign client for Profile Service
 */
@FeignClient(name = "profile-service",
        url = "${profile.service.url:http://localhost:8081/profile}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ProfileServiceClient {

    @GetMapping("/internal/profiles/available")
    ApiResponse<List<UserProfileResponseDto>> getAllAvailableUsers();

    @GetMapping("/internal/profiles/user/{userId}")
    ApiResponse<UserProfileResponseDto> getUserProfile(
            @PathVariable String userId,
            @RequestHeader("X-Internal-Request") String internalHeader
    );
}

