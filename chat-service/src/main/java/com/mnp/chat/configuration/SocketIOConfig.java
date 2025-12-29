package com.mnp.chat.configuration;

import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.databind.SerializationFeature;
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

        // ✅ GIẢI PHÁP: Sử dụng Anonymous Class để cấu hình ObjectMapper bên trong
        // Truyền JavaTimeModule vào constructor
        configuration.setJsonSupport(new JacksonJsonSupport(new JavaTimeModule()) {
            {
                // 'objectMapper' là biến protected của lớp cha (JacksonJsonSupport)
                // Chúng ta có thể cấu hình nó ngay tại đây:

                // 1. BẬT timestamp dạng milliseconds cho ngày tháng (để frontend xử lý dễ hơn)
                this.objectMapper.enable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
                // Note: Với JavaTimeModule, WRITE_DATES_AS_TIMESTAMPS sẽ trả về milliseconds (long)
                // thay vì ISO-8601 string, giúp frontend xử lý dễ dàng hơn

                // 2. Các cấu hình khác
                this.objectMapper.disable(SerializationFeature.FAIL_ON_EMPTY_BEANS);
                this.objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
            }
        });

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
