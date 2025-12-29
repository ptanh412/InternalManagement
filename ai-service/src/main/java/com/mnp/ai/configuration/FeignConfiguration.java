package com.mnp.ai.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import feign.Request;
import feign.RequestInterceptor;
import feign.Retryer;

import java.util.concurrent.TimeUnit;

@Configuration
public class FeignConfiguration {

    @Bean
    public RequestInterceptor authenticationRequestInterceptor() {
        return new AuthenticationRequestInterceptor();
    }

    /**
     * Configure Feign client timeouts for ML service
     * ML training operations can take a long time, so we need extended timeouts
     */
    @Bean
    public Request.Options requestOptions() {
        // Connect timeout: 10 seconds (10000 ms)
        // Read timeout: 5 minutes (300000 ms) - for long ML training operations
        return new Request.Options(
                10000,   // connectTimeoutMillis - 10 seconds
                300000,  // readTimeoutMillis - 5 minutes for ML training
                true     // followRedirects
        );
    }

    /**
     * Configure retry logic for failed requests
     * Retry up to 2 times with exponential backoff
     */
    @Bean
    public Retryer retryer() {
        // period: initial wait time (1 second)
        // maxPeriod: maximum wait time (5 seconds)
        // maxAttempts: total attempts including first call (3 attempts = 1 initial + 2 retries)
        return new Retryer.Default(1000, 5000, 3);
    }
}
