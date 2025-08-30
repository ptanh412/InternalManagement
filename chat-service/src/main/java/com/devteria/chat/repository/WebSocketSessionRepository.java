package com.devteria.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.devteria.chat.entity.WebSocketSession;

@Repository
public interface WebSocketSessionRepository extends MongoRepository<WebSocketSession, String> {
    void deleteBySocketSessionId(String socketId);

    Optional<WebSocketSession> findBySocketSessionId(String socketSessionId);

    List<WebSocketSession> findAllByUserIdIn(List<String> userIds);

    List<WebSocketSession> findAllByUserId(String userId);

    Optional<WebSocketSession> findByUserId(String userId);

    // Changed from Optional to List to handle multiple sessions for same user+conversation
    List<WebSocketSession> findByUserIdAndCurrentConversationId(String userId, String currentConversationId);

    List<WebSocketSession> findAllByCurrentConversationId(String currentConversationId);
}
