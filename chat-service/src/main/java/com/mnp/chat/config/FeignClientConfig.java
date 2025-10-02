package com.mnp.chat.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.mnp.chat.util.TokenHolder;

import feign.RequestInterceptor;

@Configuration
public class FeignClientConfig {
    @Bean
    public RequestInterceptor feignAuthInterceptor() {
        return requestTemplate -> {
            // Get token from thread local, context, or static config
            String token = TokenHolder.getToken();
            if (token != null && !token.isEmpty()) {
                requestTemplate.header("Authorization", "Bearer " + token);
            }
        };
    }
}
