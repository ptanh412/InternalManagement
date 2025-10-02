package com.mnp.profile.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import feign.RequestInterceptor;
import feign.RequestTemplate;

@Configuration
public class FileServiceFeignConfig {

    @Bean
    public RequestInterceptor fileServiceRequestInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                try {
                    ServletRequestAttributes servletRequestAttributes =
                            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

                    if (servletRequestAttributes != null) {
                        var authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
                        if (StringUtils.hasText(authHeader)) {
                            template.header("Authorization", authHeader);
                        }
                    }
                } catch (Exception e) {
                    // Silently handle - no auth header available
                }
            }
        };
    }
}
