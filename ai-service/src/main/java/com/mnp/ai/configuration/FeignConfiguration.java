package com.mnp.ai.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.RequestInterceptor;

@Configuration
public class FeignConfiguration {

    @Bean
    public RequestInterceptor authenticationRequestInterceptor() {
        return new AuthenticationRequestInterceptor();
    }
}
