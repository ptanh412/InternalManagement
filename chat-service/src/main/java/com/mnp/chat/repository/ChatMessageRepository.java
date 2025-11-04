package com.mnp.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.mnp.chat.entity.ChatMessage;

@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findAllByConversationIdOrderByCreatedDateDesc(String conversationId);

    // Count unread messages excluding multiple system message types
    long countByConversationIdAndSenderUserIdNotAndStatusNotAndTypeNotIn(
            String conversationId, String userId, String status, List<String> types);

    // Find all unread messages for a user in a conversation (messages not sent by the user and not seen)
    List<ChatMessage> findAllByConversationIdAndSenderUserIdNotAndStatusNot(
            String conversationId, String userId, String status);

    // Find all messages in a conversation to calculate unread count properly
    List<ChatMessage> findByConversationId(String conversationId);

    List<ChatMessage> findAllByConversationId(String conversationId);


    // ✅ Query cho GROUP conversations - TÌM messages mà user CHƯA ĐỌC
    @Query("{ 'conversationId': ?0, " +
            "  $and: [ " +
            "    { $or: [ " +
            "      { 'readers.userId': { $ne: ?1 } }, " +
            "      { 'readers': { $exists: false } }, " +
            "      { 'readers': null }, " +
            "      { 'readers': [] } " +
            "    ] } " +
            "  ] " +
            "}")
    List<ChatMessage> findUnreadMessagesForGroupConversation(String conversationId, String userId);

    // ✅ Query cho DIRECT conversations
    long countByConversationIdAndSenderUserIdNotAndStatusNot(
            String conversationId,
            String senderUserId,
            String status
    );
}
