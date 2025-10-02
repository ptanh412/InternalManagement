package com.mnp.identity.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class InternalServiceFeignConfig {

    @Bean("internalServiceRequestInterceptor")
    public RequestInterceptor internalServiceRequestInterceptor() {
        return template -> {
            // No authentication headers for internal service calls
            log.debug("Internal service call - no authentication headers added");
        };
    }
}
