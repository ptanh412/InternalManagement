package com.mnp.profile.configuration;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AuthenticationRequestInterceptor implements RequestInterceptor {
    @Override
    public void apply(RequestTemplate template) {
        try {
            ServletRequestAttributes servletRequestAttributes =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

            if (servletRequestAttributes != null) {
                var authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
                log.info("Header: {}", authHeader);
                if (StringUtils.hasText(authHeader)) {
                    template.header("Authorization", authHeader);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to get authentication header: {}", e.getMessage());
        }
    }
}
