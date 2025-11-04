package com.mnp.project.configuration;

import feign.Logger;
import feign.Request;
import feign.RequestInterceptor;
import feign.Retryer;
import feign.codec.ErrorDecoder;
import feign.jackson.JacksonDecoder;
import feign.jackson.JacksonEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import feign.FeignException;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class FeignClientConfiguration {

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }

    @Bean
    public Request.Options requestOptions() {
        // Connect timeout: 10 seconds, Read timeout: 60 seconds
        return new Request.Options(10000, java.util.concurrent.TimeUnit.MILLISECONDS, 60000, java.util.concurrent.TimeUnit.MILLISECONDS, true);
    }

    @Bean
    public Retryer retryer() {
        // Retry with 100ms initial interval, 1s max interval, 3 max attempts
        return new Retryer.Default(100, 1000, 3);
    }

    @Bean
    public JacksonEncoder jacksonEncoder() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return new JacksonEncoder(mapper);
    }

    @Bean
    public JacksonDecoder jacksonDecoder() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return new JacksonDecoder(mapper);
    }

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("Content-Type", "application/json");
            requestTemplate.header("Accept", "application/json");
        };
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new CustomErrorDecoder();
    }

    public static class CustomErrorDecoder implements ErrorDecoder {
        private final ErrorDecoder defaultErrorDecoder = new Default();

        @Override
        public Exception decode(String methodKey, feign.Response response) {
            HttpStatus responseStatus = HttpStatus.valueOf(response.status());

            log.error("Feign client error - Method: {}, Status: {}, Reason: {}",
                     methodKey, response.status(), response.reason());

            return switch (responseStatus) {
                case BAD_REQUEST -> new FeignException.BadRequest(
                    "Bad request for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case UNAUTHORIZED -> new FeignException.Unauthorized(
                    "Unauthorized access for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case FORBIDDEN -> new FeignException.Forbidden(
                    "Forbidden access for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case NOT_FOUND -> new FeignException.NotFound(
                    "Resource not found for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case INTERNAL_SERVER_ERROR -> new FeignException.InternalServerError(
                    "Internal server error for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case SERVICE_UNAVAILABLE -> new FeignException.ServiceUnavailable(
                    "Service unavailable for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                case GATEWAY_TIMEOUT -> new FeignException.GatewayTimeout(
                    "Gateway timeout for method: " + methodKey,
                    response.request(),
                    response.body() != null ? response.body().toString().getBytes() : null,
                    response.headers()
                );
                default -> defaultErrorDecoder.decode(methodKey, response);
            };
        }
    }
}
