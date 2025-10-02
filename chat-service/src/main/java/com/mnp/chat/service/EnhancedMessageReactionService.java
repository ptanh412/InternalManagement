package com.mnp.chat.service;

import java.time.Instant;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mnp.chat.entity.ChatMessage;
import com.mnp.chat.entity.ParticipantInfo;
import com.mnp.chat.repository.ChatMessageRepository;
import com.mnp.chat.repository.ConversationRepository;
import com.mnp.chat.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class EnhancedMessageReactionService {

    MessageReactionService messageReactionService;
    ChatMessageRepository chatMessageRepository;
    ConversationRepository conversationRepository;
    ProfileClient profileClient;
    ChatMessageService chatMessageService; // Add this dependency

    /**
     * Enhanced method to add reaction and create system message
     */
    @Transactional
    public int addReactionWithSystemMessage(String messageId, String userId, String icon) {
        // Add the reaction first
        int reactionCount = messageReactionService.addReaction(messageId, userId, icon);

        // Create system message for the reaction
        createReactionSystemMessage(messageId, userId, icon, true);

        return reactionCount;
    }

    /**
     * Enhanced method to toggle reaction and create system message
     */
    @Transactional
    public boolean toggleReactionWithSystemMessage(String messageId, String userId, String icon) {
        boolean isAdded = messageReactionService.toggleReaction(messageId, userId, icon);

        // Create system message for the reaction
        createReactionSystemMessage(messageId, userId, icon, isAdded);

        return isAdded;
    }

    /**
     * Enhanced method to remove reaction and create system message
     */
    @Transactional
    public int removeReactionWithSystemMessage(String messageId, String userId, String icon) {
        int result = messageReactionService.removeReaction(messageId, userId, icon);

        // Create system message for reaction removal
        createReactionSystemMessage(messageId, userId, icon, false);

        return result;
    }

    /**
     * Creates a system message for reaction events and updates conversation's last message
     */
    private void createReactionSystemMessage(String messageId, String userId, String icon, boolean isAdded) {
        try {
            // Get the original message to find its conversation
            var originalMessage = chatMessageRepository.findById(messageId);
            if (originalMessage.isEmpty()) {
                log.error("Original message not found: {}", messageId);
                return;
            }

            String conversationId = originalMessage.get().getConversationId();

            // Get conversation
            var conversation = conversationRepository.findById(conversationId);
            if (conversation.isEmpty()) {
                log.error("Conversation not found: {}", conversationId);
                return;
            }

            // Get user info for system message
            var userResponse = profileClient.getProfile(userId);
            if (Objects.isNull(userResponse) || Objects.isNull(userResponse.getResult())) {
                log.error("User profile not found: {}", userId);
                return;
            }
            var userInfo = userResponse.getResult();

            // Create system message text
            String systemMessageText;
            if (isAdded) {
                systemMessageText = userInfo.getFirstName() + " " + userInfo.getLastName() + " reacted " + icon;
            } else {
                systemMessageText =
                        userInfo.getFirstName() + " " + userInfo.getLastName() + " removed reaction " + icon;
            }

            // Create system message
            ChatMessage systemMessage = ChatMessage.builder()
                    .conversationId(conversationId)
                    .message(systemMessageText)
                    .type("SYSTEM_REACTION") // Special type for reaction system messages
                    .status("SENT")
                    .createdDate(Instant.now())
                    .sender(ParticipantInfo.builder()
                            .userId(userInfo.getUserId())
                            .username(userInfo.getUsername())
                            .firstName(userInfo.getFirstName())
                            .lastName(userInfo.getLastName())
                            .avatar(userInfo.getAvatar())
                            .build())
                    .build();

            // Save system message
            systemMessage = chatMessageRepository.save(systemMessage);

            // Update conversation lastMessage with system message
            var conv = conversation.get();
            conv.setLastMessage(systemMessage);
            conv.setModifiedDate(Instant.now());
            conversationRepository.save(conv);

            // Broadcast the system message to participants
            chatMessageService.broadcastSystemMessage(systemMessage);

            log.info(
                    "Created and broadcasted reaction system message: '{}' for conversation: {}",
                    systemMessageText,
                    conversationId);

        } catch (Exception e) {
            log.error(
                    "Error creating reaction system message for messageId: {}, userId: {}, icon: {}",
                    messageId,
                    userId,
                    icon,
                    e);
        }
    }
}
