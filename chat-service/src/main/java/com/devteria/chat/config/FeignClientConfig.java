package com.devteria.chat.config;

import feign.RequestInterceptor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfig {
    @Bean
    public RequestInterceptor feignAuthInterceptor() {
        return requestTemplate -> {
            // Get token from thread local, context, or static config
            String token = com.devteria.chat.util.TokenHolder.getToken();
            if (token != null && !token.isEmpty()) {
                requestTemplate.header("Authorization", "Bearer " + token);
            }
        };
    }
}
