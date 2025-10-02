package com.mnp.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mnp.identity.configuration.InternalServiceFeignConfig;
import com.mnp.identity.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.response.UserProfileResponse;

// Create a separate client for internal service calls without authentication
@FeignClient(
        name = "profile-service-internal",
        url = "${app.services.profile}",
        configuration = {InternalServiceFeignConfig.class})
public interface InternalProfileClient {

    @PostMapping(value = "/internal/users/inter-service", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<UserProfileResponse> createProfileInterService(@RequestBody InterServiceProfileCreationRequest request);
}
