package com.mnp.project.client;

import com.mnp.project.configuration.FeignClientConfiguration;
import com.mnp.project.dto.response.ApiResponse;
import com.mnp.project.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = FeignClientConfiguration.class)
public interface IdentityServiceClient {

    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId);
}
