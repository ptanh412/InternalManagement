package com.devteria.chat.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.devteria.chat.entity.WebSocketSession;
import com.devteria.chat.repository.WebSocketSessionRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class WebSocketSessionService {
    WebSocketSessionRepository webSocketSessionRepository;

    public WebSocketSession create(WebSocketSession webSocketSession) {
        return webSocketSessionRepository.save(webSocketSession);
    }

    public void deleteSession(String sessionId) {
        webSocketSessionRepository.deleteBySocketSessionId(sessionId);
    }

    public void updateCurrentConversationId(String socketSessionId, String conversationId) {
        Optional<WebSocketSession> session = webSocketSessionRepository.findBySocketSessionId(socketSessionId);
        if (session.isPresent()) {
            WebSocketSession webSocketSession = session.get();
            webSocketSession.setCurrentConversationId(conversationId);
            webSocketSession.setLastActivityAt(Instant.now());
            webSocketSessionRepository.save(webSocketSession);
            log.info("Updated current conversation ID for session: {}", socketSessionId);
        } else {
            log.warn("No WebSocket session found for socketSessionId: {}", socketSessionId);
        }
    }

    public boolean isUserInConversation(String userId, String conversationId) {
        // Get all sessions for user in this conversation (can be multiple tabs/windows)
        var sessions = webSocketSessionRepository.findByUserIdAndCurrentConversationId(userId, conversationId);

        log.info(
                "Checking if user {} is in conversation {}: found {} sessions",
                userId,
                conversationId,
                sessions.size());

        if (sessions.isEmpty()) {
            log.info("No active session found for user {} in conversation {}", userId, conversationId);
            return false;
        }

        // Check if any session has recent activity (within last 5 minutes)
        Instant fiveMinutesAgo = Instant.now().minusSeconds(300);

        for (WebSocketSession session : sessions) {
            boolean isRecentActivity = session.getLastActivityAt() != null
                    && session.getLastActivityAt().isAfter(fiveMinutesAgo);

            if (isRecentActivity) {
                log.info(
                        "Found active session for user {} in conversation {}: sessionId={}, lastActivity={}",
                        userId,
                        conversationId,
                        session.getSocketSessionId(),
                        session.getLastActivityAt());
                return true;
            }
        }

        log.warn(
                "Found {} sessions for user {} in conversation {} but all have stale activity",
                sessions.size(),
                userId,
                conversationId);
        return false;
    }

    public Optional<WebSocketSession> getSessionBySocketId(String socketSessionId) {
        return webSocketSessionRepository.findBySocketSessionId(socketSessionId);
    }
}
