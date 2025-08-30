package com.devteria.chat.service;

import java.time.LocalDateTime;
import java.util.Objects;

import com.devteria.chat.dto.request.UserStatusUpdateRequest;
import org.springframework.stereotype.Service;

import com.devteria.chat.dto.request.IntrospectRequest;
import com.devteria.chat.dto.response.IntrospectResponse;
import com.devteria.chat.repository.httpclient.IdentityClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class IdentityService {
    IdentityClient identityClient;

    public IntrospectResponse introspect(IntrospectRequest request) {
        try {
            var result = identityClient.introspect(request).getResult();
            if (Objects.isNull(result)) {
                return IntrospectResponse.builder().valid(false).build();
            }
            return result;
        } catch (FeignException e) {
            log.error("Introspect failed: {}", e.getMessage(), e);
            return IntrospectResponse.builder().valid(false).build();
        }
    }
    public void updateUserStatus(String userId, Boolean online, LocalDateTime lastLogin) {
        UserStatusUpdateRequest request = UserStatusUpdateRequest.builder()
                .online(online)
                .lastLogin(lastLogin)
                .build();
        try {
            identityClient.updateUserStatus(userId, request);
        } catch (Exception e) {
            log.error("Failed to update user status for userId {}: {}", userId, e.getMessage());
        }
    }
}
