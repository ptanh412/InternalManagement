package com.devteria.notification.configuration;

import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

public class JwtHandshakeInterceptor implements HandshakeInterceptor {
    private final CustomJwtDecoder customJwtDecoder;

    public JwtHandshakeInterceptor(CustomJwtDecoder customJwtDecoder) {
        this.customJwtDecoder = customJwtDecoder;
    }

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest httpServletRequest = servletRequest.getServletRequest();
            String authHeader = httpServletRequest.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                try {
                    org.springframework.security.oauth2.jwt.Jwt jwt = customJwtDecoder.decode(token);
                    String userId = jwt.getSubject(); // or jwt.getClaim("userId") if needed
                    // Optionally, set userId as an attribute for later use
                    attributes.put("userId", userId);
                    // Optionally, set authentication in SecurityContext if needed
                    // SecurityContextHolder.getContext().setAuthentication(...)
                } catch (Exception e) {
                    // Invalid token, do nothing or log
                }
            }
        }
        return true;
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler, Exception exception) {}
}
