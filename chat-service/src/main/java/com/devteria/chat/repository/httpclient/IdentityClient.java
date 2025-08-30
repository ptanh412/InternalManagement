package com.devteria.chat.repository.httpclient;

import com.devteria.chat.dto.request.UserStatusUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.devteria.chat.dto.ApiResponse;
import com.devteria.chat.dto.request.IntrospectRequest;
import com.devteria.chat.dto.response.IntrospectResponse;

@FeignClient(name = "identity-client", url = "${app.services.identity.url}", configuration = com.devteria.chat.config.FeignClientConfig.class)
public interface IdentityClient {
    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request);
    
    @PostMapping("/users/{userId}/status")
    ApiResponse<Void> updateUserStatus(@PathVariable("userId") String userId, @RequestBody UserStatusUpdateRequest request);
}
