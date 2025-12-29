package com.mnp.workload.client;

import com.mnp.workload.dto.response.ApiResponseDTO;
import com.mnp.workload.dto.response.UserProfileResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "profile-service", url = "${app.services.profile}")
public interface ProfileServiceClient {

    /**
     * Get user profile information (includes user data from identity-service)
     */
    @GetMapping("/internal/users/{userId}")
    ApiResponseDTO<UserProfileResponseDTO> getUserProfile(@PathVariable("userId") String userId);
}
