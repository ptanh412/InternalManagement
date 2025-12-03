package com.internalmanagement.mlservice.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.util.StringUtils;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
public class AuthenticationRequestInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        // Add internal service marker header for service-to-service calls
        // This helps profile-service identify that the call is from another internal service
        template.header("X-Internal-Request", "true");
        template.header("X-Service-Name", "ml-service");
        log.debug("Added internal service headers for service-to-service call");

        ServletRequestAttributes servletRequestAttributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        // If there's an incoming HTTP request, forward the Authorization header
        if (servletRequestAttributes != null) {
            var authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
            log.debug("Found Authorization header: {}", authHeader != null ? "present" : "absent");
            if (StringUtils.hasText(authHeader)) {
                template.header("Authorization", authHeader);
            }
        } else {
            log.debug("No request context available - using only internal service headers");
        }
    }
}
