package com.devteria.notification.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class SocketIONotificationConfig {

    @Bean
    public SocketIOServer socketIOServer() { // Fixed bean name to match service dependency
        com.corundumstudio.socketio.Configuration configuration = new com.corundumstudio.socketio.Configuration();
        configuration.setPort(8100); // Different port from chat service
        configuration.setOrigin("*");
        configuration.setHostname("localhost");

        // Enable CORS for all origins (adjust for production)
        configuration.setAllowCustomRequests(true);

        // Configure Jackson to handle Java 8 time types
        configuration.setJsonSupport(new com.corundumstudio.socketio.protocol.JacksonJsonSupport(new JavaTimeModule()));

        // Authentication configuration - Fixed to return AuthorizationResult
        configuration.setAuthorizationListener(data -> {
            // Extract token from handshake data
            String token = data.getSingleUrlParam("token");
            String userId = data.getSingleUrlParam("userId");
            // TODO: Implement JWT token validation here
            if (token != null && !token.isEmpty() && userId != null && !userId.isEmpty()) {
                return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;
            } else {
                return AuthorizationResult.FAILED_AUTHORIZATION;
            }
        });

        return new SocketIOServer(configuration);
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketIOServer) { // Fixed parameter name
        return new SpringAnnotationScanner(socketIOServer);
    }
}
