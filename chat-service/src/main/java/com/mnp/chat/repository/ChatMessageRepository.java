package com.mnp.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import com.mnp.chat.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findAllByConversationIdOrderByCreatedDateDesc(String conversationId);

    Optional<ChatMessage> findChatMessageById(String id);

    // Count unread messages for a user in a conversation (messages not sent by the user and not seen)
    long countByConversationIdAndSenderUserIdNotAndStatusNot(String conversationId, String userId, String status);

    // Count unread messages excluding system messages for proper unread count
    long countByConversationIdAndSenderUserIdNotAndStatusNotAndTypeNot(
            String conversationId, String userId, String status, String type);

    // Count unread messages excluding multiple system message types
    long countByConversationIdAndSenderUserIdNotAndStatusNotAndTypeNotIn(
            String conversationId, String userId, String status, List<String> types);

    // Find all unread messages for a user in a conversation (messages not sent by the user and not seen)
    List<ChatMessage> findAllByConversationIdAndSenderUserIdNotAndStatusNot(
            String conversationId, String userId, String status);

    // New methods to fix unread count issues
    List<ChatMessage> findByConversationIdAndStatusNotAndSenderUserIdNot(
            String conversationId, String status, String userId);

    List<ChatMessage> findByConversationIdAndTypeAndSenderIsNullAndReadersNotContaining(
            String conversationId, String type, String userId);

    long countByConversationIdAndReadersNotContaining(String conversationId, String userId);

    Object getChatMessageById(String id);

    List<ChatMessage> findByConversationIdOrderByCreatedDateDesc(String conversationId);

    // Find all messages in a conversation to calculate unread count properly
    List<ChatMessage> findByConversationId(String conversationId);

    // Find system messages by conversation ID and types, excluding a specific status
    List<ChatMessage> findByConversationIdAndTypeInAndStatusNot(
            String conversationId, List<String> types, String status);
}
