package com.mnp.chat.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mnp.chat.config.FeignClientConfig;
import com.mnp.chat.dto.ApiResponse;
import com.mnp.chat.dto.request.IntrospectRequest;
import com.mnp.chat.dto.request.UserStatusUpdateRequest;
import com.mnp.chat.dto.response.IntrospectResponse;

@FeignClient(name = "identity-client", url = "${app.services.identity.url}", configuration = FeignClientConfig.class)
public interface IdentityClient {
    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request);

    @PostMapping("/users/{userId}/status")
    ApiResponse<Void> updateUserStatus(
            @PathVariable("userId") String userId, @RequestBody UserStatusUpdateRequest request);
}
