package com.mnp.post.configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FeignClientInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate requestTemplate) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication instanceof JwtAuthenticationToken jwtAuthenticationToken) {
            Jwt jwt = jwtAuthenticationToken.getToken();
            String tokenValue = jwt.getTokenValue();
            requestTemplate.header("Authorization", "Bearer " + tokenValue);
            log.debug("Added JWT token to Feign request: {}", requestTemplate.url());
        } else {
            log.debug("No JWT token available for Feign request to: {} (authentication: {})", 
                    requestTemplate.url(), 
                    authentication != null ? authentication.getClass().getSimpleName() : "null");
        }
    }
}
