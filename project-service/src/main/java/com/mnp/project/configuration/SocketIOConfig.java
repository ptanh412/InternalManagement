package com.mnp.project.configuration;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SocketIOConfig {

    @Value("${socketio.server.host:localhost}")
    private String host;

    @Value("${socketio.server.port:9095}")
    private Integer port;

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname(host);
        config.setPort(port);

        // Enable CORS for frontend integration
        config.setOrigin("*");

        // Connection timeout (in milliseconds)
        config.setFirstDataTimeout(30000);
        // Configure Jackson to handle Java 8 time types
        config.setJsonSupport(new com.corundumstudio.socketio.protocol.JacksonJsonSupport(new JavaTimeModule()));

        SocketIOServer server = new SocketIOServer(config);

        server.addConnectListener(client -> {
            log.info("Client connected: {}", client.getSessionId());
        });

        server.addDisconnectListener(client -> {
            log.info("Client disconnected: {}", client.getSessionId());
        });

        return server;
    }
}
