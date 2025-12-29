package com.mnp.post.configuration;

import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.AuthorizationResult;
import com.corundumstudio.socketio.annotation.SpringAnnotationScanner;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class SocketIOConfig {

    @Value("${socket.port:8089}")
    private int socketPort;

    @Value("${socket.host:localhost}")
    private String socketHost;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration configuration = new com.corundumstudio.socketio.Configuration();
        configuration.setPort(socketPort);
        configuration.setOrigin("*");
        configuration.setHostname(socketHost);
        configuration.setAllowCustomRequests(true);

        // ✅ GIẢI PHÁP: Sử dụng Anonymous Class để cấu hình ObjectMapper bên trong
        // Truyền JavaTimeModule vào constructor
        configuration.setJsonSupport(new JacksonJsonSupport(new JavaTimeModule()) {
            {
                // 'objectMapper' là biến protected của lớp cha (JacksonJsonSupport)
                // Chúng ta có thể cấu hình nó ngay tại đây:

                // 1. Tắt timestamp cho ngày tháng (quan trọng nhất theo code của bạn)
                this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

                // 2. Các cấu hình khác
                this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
                this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
            }
        });

        // Authentication configuration
        configuration.setAuthorizationListener(data -> {
            String token = data.getSingleUrlParam("token");
            // TODO: Implement JWT token validation here
            return (token != null && !token.isEmpty())
                    ? AuthorizationResult.SUCCESSFUL_AUTHORIZATION
                    : AuthorizationResult.FAILED_AUTHORIZATION;
        });

        return new SocketIOServer(configuration);
    }

    @Bean
    public SpringAnnotationScanner springAnnotationScanner(SocketIOServer socketIOServer) {
        return new SpringAnnotationScanner(socketIOServer);
    }
}

