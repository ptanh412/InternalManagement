package com.mnp.chat.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration configuration = new com.corundumstudio.socketio.Configuration();
        configuration.setPort(8099);
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
            // TODO: Implement JWT token validation here
            if (token != null && !token.isEmpty()) {
                return AuthorizationResult.SUCCESSFUL_AUTHORIZATION;
            } else {
                return AuthorizationResult.FAILED_AUTHORIZATION;
            }
        });

        return new SocketIOServer(configuration);
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketIOServer) {
        return new SpringAnnotationScanner(socketIOServer);
    }
}
