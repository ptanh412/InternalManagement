package com.mnp.assignment.client;

import com.mnp.assignment.configuration.FeignClientConfiguration;
import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.response.UserResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = FeignClientConfiguration.class)
public interface IdentityServiceClient {

    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable String userId);
}
