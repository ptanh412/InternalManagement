package com.mnp.profile.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mnp.profile.config.InternalFeignConfig;
import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.response.UserResponse;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = InternalFeignConfig.class)
public interface IdentityClient {

    @GetMapping("/internal/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId);
}
