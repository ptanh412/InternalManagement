package com.mnp.profile.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import feign.RequestTemplate;

@Configuration
public class FeignConfig {

    @Bean
    public RequestInterceptor requestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                // Remove all authorization headers for internal service calls
                template.removeHeader("Authorization");
                template.removeHeader("authorization");

                // Clear any bearer tokens
                template.removeHeader("Bearer");

                // Add internal service identifier
                template.header("X-Internal-Service", "profile-service");
                template.header("X-Service-Type", "internal");

                // Log for debugging
                System.out.println("Feign request URL: " + template.url());
                System.out.println("Feign request headers: " + template.headers());
            }
        };
    }
}
