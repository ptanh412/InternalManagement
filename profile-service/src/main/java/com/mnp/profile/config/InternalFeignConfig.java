package com.mnp.profile.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;

import feign.RequestInterceptor;
import feign.RequestTemplate;

@Configuration
public class InternalFeignConfig {

    @Bean
    public RequestInterceptor internalRequestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Clear all existing headers first
                template.headers().clear();

                // Add only the headers we need for internal communication
                template.header("Content-Type", "application/json");
                template.header("Accept", "application/json");
                template.header("X-Internal-Service", "profile-service");
                template.header("X-Service-Type", "internal");

                // Explicitly ensure no authentication context is used
                SecurityContextHolder.clearContext();
            }
        };
    }
}
