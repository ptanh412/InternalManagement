package com.mnp.task.service;

import com.mnp.task.client.IdentityClient;
import com.mnp.task.dto.request.IntrospectRequest;
import com.mnp.task.dto.response.IntrospectResponse;
import com.mnp.task.exception.AppException;
import com.mnp.task.exception.ErrorCode;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthenticationService {

    IdentityClient identityClient;

    /**
     * Extract user ID from HTTP request Authorization header
     */
    public String getUserIdFromRequest(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");

        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        return getUserIdFromToken(authorizationHeader);
    }

    /**
     * Validate token and extract user ID
     */
    public String getUserIdFromToken(String token) {
        try {
            // Remove Bearer prefix if present
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            IntrospectRequest request = IntrospectRequest.builder()
                    .token(token)
                    .build();

            var response = identityClient.introspectToken(request);
            IntrospectResponse introspectResult = response.getResult();

            if (!introspectResult.isValid()) {
                throw new AppException(ErrorCode.UNAUTHENTICATED);
            }

            return introspectResult.getUserId();
        } catch (Exception e) {
            log.error("Error validating token: {}", e.getMessage());
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
    }
}
