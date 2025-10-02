package com.mnp.identity.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mnp.identity.configuration.AuthenticationRequestInterceptor;
import com.mnp.identity.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.ProfileCreationRequest;
import com.mnp.identity.dto.response.UserProfileResponse;

@FeignClient(
        name = "profile-service",
        url = "${app.services.profile}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface ProfileClient {

    @PostMapping(value = "/internal/users", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<UserProfileResponse> createProfile(@RequestBody ProfileCreationRequest request);

    @PostMapping(value = "/internal/users/inter-service", produces = MediaType.APPLICATION_JSON_VALUE)
    ApiResponse<UserProfileResponse> createProfileInterService(@RequestBody InterServiceProfileCreationRequest request);
}
