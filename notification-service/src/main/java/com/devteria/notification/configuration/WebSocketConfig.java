package com.devteria.notification.configuration;

import java.security.Principal;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketConfig.class);

    @Autowired
    private CustomJwtDecoder jwtTokenUtil;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for /topic and /queue destinations
        config.enableSimpleBroker("/topic", "/queue");
        // Set application destination prefix for messages from clients
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix for personalized messages
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:3000")
                .addInterceptors(new JwtHandshakeInterceptor(jwtTokenUtil))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authToken = accessor.getFirstNativeHeader("Authorization");
                    if (authToken != null && authToken.startsWith("Bearer ")) {
                        String token = authToken.substring(7);
                        try {
                            org.springframework.security.oauth2.jwt.Jwt jwt = jwtTokenUtil.decode(token);
                            String userId = jwt.getSubject(); // 'sub' claim is userId
                            if (userId == null || userId.isEmpty()) {
                                logger.warn("JWT does not contain a subject (userId), rejecting WebSocket connection");
                                return null; // Reject connection if userId is missing
                            }
                            accessor.setUser(new Principal() {
                                @Override
                                public String getName() {
                                    return userId;
                                }
                            });
                            logger.info("WebSocket connection established for userId: {}", userId);
                        } catch (Exception e) {
                            logger.warn("Invalid JWT token for WebSocket connection", e);
                            return null; // Reject connection if token is invalid
                        }
                    } else {
                        logger.warn("WebSocket connection without valid Authorization header");
                        return null; // Reject connection if Authorization header is missing
                    }
                }
                return message;
            }
        });
    }
}
