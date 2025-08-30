package com.devteria.chat.controller;

import java.time.Instant;
import java.util.Map;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.devteria.chat.dto.request.*;
import com.devteria.chat.dto.response.ChatMessageResponse;
import com.devteria.chat.dto.response.ConversationResponse;
import com.devteria.chat.entity.WebSocketSession;
import com.devteria.chat.repository.ChatMessageRepository;
import com.devteria.chat.service.*;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SocketHandler {
    SocketIOServer server;
    IdentityService identityService;
    WebSocketSessionService webSocketSessionService;
    ChatMessageService chatMessageService;
    ConversationService conversationService;
    MessageReactionService messageReactionService;
    EnhancedMessageReactionService enhancedMessageReactionService;
    private final ChatMessageRepository chatMessageRepository;

    @OnConnect
    public void clientConnected(SocketIOClient client) {
        log.info("Client connected: {}", client.getSessionId());
        // Get Token from request param
        String token = client.getHandshakeData().getSingleUrlParam("token");

        // Verify token
        var introspectResponse = identityService.introspect(
            IntrospectRequest.builder().token(token).build());

        // If Token is invalid disconnect
        if (introspectResponse.isValid()) {
            log.info("Client connected: {}", client.getSessionId());
            // Persist webSocketSession
            WebSocketSession webSocketSession = WebSocketSession.builder()
                .socketSessionId(client.getSessionId().toString())
                .userId(introspectResponse.getUserId())
                .createdAt(Instant.now())
                .build();
            webSocketSession = webSocketSessionService.create(webSocketSession);

            log.info("WebSocketSession created with id: {}", webSocketSession.getId());

            // Set token for Feign interceptor
            com.devteria.chat.util.TokenHolder.setToken(token);
            try {
                // Update user status: online=true, lastLogin=now
                identityService.updateUserStatus(introspectResponse.getUserId(), true, java.time.LocalDateTime.now());
            } finally {
                com.devteria.chat.util.TokenHolder.clear();
            }
        } else {
            log.error("Authentication fail: {}", client.getSessionId());
            client.disconnect();
        }
    }

    @OnDisconnect
    public void clientDisconnected(SocketIOClient client) {
        log.info("Client disConnected: {}", client.getSessionId());
        var webSocketSession = webSocketSessionService.getSessionBySocketId(client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            String userId = webSocketSession.get().getUserId();
            // Try to get token from handshake (if available)
            String token = client.getHandshakeData().getSingleUrlParam("token");
            com.devteria.chat.util.TokenHolder.setToken(token);
            try {
                // Update user status: online=false
                identityService.updateUserStatus(userId, false, null);
            } finally {
                com.devteria.chat.util.TokenHolder.clear();
            }
        }
        webSocketSessionService.deleteSession(client.getSessionId().toString());
    }

    @OnEvent("join-conversation")
    public void onJoinConversation(SocketIOClient client, String conversationId) {
        log.info("Client joined conversation: {} - {}", client.getSessionId(), conversationId);
        webSocketSessionService.updateCurrentConversationId(
                client.getSessionId().toString(), conversationId);
    }

    @OnEvent("leave-conversation")
    public void onLeaveConversation(SocketIOClient client, String conversationId) {
        log.info("Client left conversation: {} - {}", client.getSessionId(), conversationId);
        webSocketSessionService.updateCurrentConversationId(
                client.getSessionId().toString(), null);
    }

    @OnEvent("message-status-update")
    public void onMessageStatusUpdate(SocketIOClient client, String conversationId) {
        log.info("Client updating message status for conversation: {} - {}", client.getSessionId(), conversationId);

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            String userId = webSocketSession.get().getUserId();
            log.info("Processing message status update for user: {} in conversation: {}", userId, conversationId);

            try {
                // Mark messages as read and get the updated messages
                var updatedMessages = chatMessageService.markMessagesAsReadAndGetUpdated(conversationId, userId);
                log.info("Found {} messages to mark as read", updatedMessages.size());

                if (!updatedMessages.isEmpty()) {
                    // Broadcast status update to all participants in the conversation
                    chatMessageService.broadcastMessageStatusUpdate(conversationId, updatedMessages);
                    log.info("Broadcasted status update for {} messages", updatedMessages.size());
                } else {
                    log.info("No unread messages found to update");
                }
            } catch (Exception e) {
                log.error("Error processing message status update for conversation: {}", conversationId, e);
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
        }
    }

    @OnEvent("reply-message")
    public void onReplyMessage(SocketIOClient client, ReplyMessageRequest request) {
        log.info(
                "Client sending reply message: {} to conversation: {}",
                client.getSessionId(),
                request.getConversationId());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                // Create the reply message
                String userId = webSocketSession.get().getUserId();
                var replyMessageResponse = chatMessageService.createReply(request, userId);
                log.info("Reply message created successfully: {}", replyMessageResponse.getId());
            } catch (Exception e) {
                log.error("Error creating reply message for conversation: {}", request.getConversationId(), e);
                // Send error event back to client
                client.sendEvent("reply-message-error", "Failed to send reply message");
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("reply-message-error", "Invalid session");
        }
    }

    @OnEvent("react-message")
    public void onReactMessage(SocketIOClient client, ReactMessageRequest request) {
        log.info("Client reacting to message: {} with icon: {}", request.getMessageId(), request.getIcon());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();

                // Use enhanced reaction service to add reaction and create system message
                int newCount = enhancedMessageReactionService.addReactionWithSystemMessage(
                        request.getMessageId(), userId, request.getIcon());

                // Broadcast reaction update to all participants in the conversation
                chatMessageService.broadcastReactionUpdate(request.getMessageId(), userId);

                log.info(
                        "Reaction {} added for message {} by user {} (new count: {}) with system message created",
                        request.getIcon(),
                        request.getMessageId(),
                        userId,
                        newCount);

            } catch (Exception e) {
                log.error("Error processing reaction for message: {}", request.getMessageId(), e);
                client.sendEvent("react-message-error", "Failed to react to message");
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("react-message-error", "Invalid session");
        }
    }

    @OnEvent("remove-reaction")
    public void onRemoveReaction(SocketIOClient client, ReactMessageRequest request) {
        log.info("Client removing reaction from message: {} with icon: {}", request.getMessageId(), request.getIcon());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();

                // Use enhanced reaction service to remove reaction and create system message
                int newCount = enhancedMessageReactionService.removeReactionWithSystemMessage(
                        request.getMessageId(), userId, request.getIcon());

                // Broadcast reaction update to all participants in the conversation
                chatMessageService.broadcastReactionUpdate(request.getMessageId(), userId);

                log.info(
                        "Reaction {} removed from message {} by user {} (new count: {}) with system message created",
                        request.getIcon(),
                        request.getMessageId(),
                        userId,
                        newCount);

            } catch (Exception e) {
                log.error("Error removing reaction from message: {}", request.getMessageId(), e);
                client.sendEvent("remove-reaction-error", "Failed to remove reaction");
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("remove-reaction-error", "Invalid session");
        }
    }

    @OnEvent("recall-message")
    public void onRecallMessage(SocketIOClient client, RecallMessageRequest request) {
        log.info(
                "🔥 RECALL MESSAGE EVENT RECEIVED - messageId: {}, recallType: {}",
                request.getMessageId(),
                request.getRecallType());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();
                log.info("🔥 Found user session: {}", userId);

                // Validate recall type
                if (!"self".equals(request.getRecallType()) && !"everyone".equals(request.getRecallType())) {
                    log.error("🔥 Invalid recall type: {}", request.getRecallType());
                    client.sendEvent("recall-message-error", "Invalid recall type. Must be 'self' or 'everyone'");
                    return;
                }

                log.info("🔥 Recall type {} is valid for message {}", request.getRecallType(), request.getMessageId());

                // Recall the message
                var recallResponse =
                        chatMessageService.recallMessage(request.getMessageId(), userId, request.getRecallType());

                log.info(
                        "🔥 Message {} recalled successfully by user {} with type: {}",
                        request.getMessageId(),
                        userId,
                        request.getRecallType());

                // Send success response to the client who initiated the recall
                client.sendEvent("recall-message-success", recallResponse);

            } catch (Exception e) {
                log.error("🔥 Error recalling message: {}", request.getMessageId(), e);
                String errorMessage = "Failed to recall message: " + e.getMessage();
                client.sendEvent("recall-message-error", errorMessage);
            }
        } else {
            log.warn("🔥 No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("recall-message-error", "Invalid session");
        }
    }

    @OnEvent("pin-message")
    public void onPinMessage(SocketIOClient client, PinMessageRequest request) {
        log.info("Client pin/unpin message: {} - pin: {}", request.getMessageId(), request.isPin());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();
                log.info("Found user session: {}", userId);

                ChatMessageResponse response;
                if (request.isPin()) {
                    // Pin the message
                    response = chatMessageService.pinMessage(request.getMessageId(), userId);
                    log.info("Message {} pinned successfully by user {}", request.getMessageId(), userId);
                } else {
                    // Unpin the message
                    response = chatMessageService.unpinMessage(request.getMessageId(), userId);
                    log.info("Message {} unpinned successfully by user {}", request.getMessageId(), userId);
                }

                // Send success response to the client who initiated the pin/unpin
                String eventName = request.isPin() ? "pin-message-success" : "unpin-message-success";
                client.sendEvent(eventName, response);

            } catch (Exception e) {
                log.error("Error processing pin/unpin for message: {}", request.getMessageId(), e);
                String errorMessage =
                        "Failed to " + (request.isPin() ? "pin" : "unpin") + " message: " + e.getMessage();
                client.sendEvent("pin-message-error", errorMessage);
            }
        }
    }

    /**
     * Handle media message sending via socket
     */
    @OnEvent("send-media-message")
    public void onSendMediaMessage(SocketIOClient client, SocketMediaMessageRequest request) {
        log.info("📁 Received media message event from client: {}", client.getSessionId());

        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("media-message-error", "User not authenticated");
                return;
            }

            // Debug logging to see what data we received
            log.info(
                    "📁 Debug - Request data: conversationId={}, fileUrl={}, fileName={}, fileType={}, fileSize={}, caption={}",
                    request.getConversationId(),
                    request.getFileUrl(),
                    request.getFileName(),
                    request.getFileType(),
                    request.getFileSize(),
                    request.getCaption());

            log.info(
                    "📁 Processing media message for user: {} in conversation: {}",
                    userId,
                    request.getConversationId());

            // Create media message
            ChatMessageResponse response = chatMessageService.createSocketMediaMessage(request, userId);

            // Send success response to sender
            client.sendEvent("media-message-success", response);
            log.info("📁 Media message sent successfully: {}", response.getId());

        } catch (Exception e) {
            log.error("📁 Error sending media message", e);
            client.sendEvent("media-message-error", "Failed to send media message: " + e.getMessage());
        }
    }

    /**
     * Handle media reply message via socket
     */
    @OnEvent("send-media-reply")
    public void onSendMediaReply(SocketIOClient client, SocketMediaMessageRequest request) {
        log.info("📁 Received media reply event from client: {}", client.getSessionId());

        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("media-reply-error", "User not authenticated");
                return;
            }

            if (request.getReplyToMessageId() == null) {
                client.sendEvent("media-reply-error", "Reply message ID is required");
                return;
            }

            log.info("📁 Processing media reply for user: {} in conversation: {}", userId, request.getConversationId());

            // Create media reply message
            ChatMessageResponse response = chatMessageService.createSocketMediaReply(request, userId);

            // Send success response to sender
            client.sendEvent("media-reply-success", response);
            log.info("📁 Media reply sent successfully: {}", response.getId());

        } catch (Exception e) {
            log.error("📁 Error sending media reply", e);
            client.sendEvent("media-reply-error", "Failed to send media reply: " + e.getMessage());
        }
    }

    /**
     * Handle delete media message via socket
     */
    @OnEvent("delete-media-message")
    public void onDeleteMediaMessage(SocketIOClient client, String messageId) {
        log.info("📁 Received delete media message event for message: {}", messageId);

        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("delete-media-error", "User not authenticated");
                return;
            }

            // Delete media message
            chatMessageService.deleteSocketMediaMessage(messageId, userId);

            // Send success response
            client.sendEvent("delete-media-success", messageId);
            log.info("📁 Media message deleted successfully: {}", messageId);

        } catch (Exception e) {
            log.error("📁 Error deleting media message: {}", messageId, e);
            client.sendEvent("delete-media-error", "Failed to delete media message: " + e.getMessage());
        }
    }

    /**
     * Helper method to get userId from client session
     */
    private String getUserIdFromClient(SocketIOClient client) {
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        return webSocketSession.map(session -> session.getUserId()).orElse(null);
    }

    /**
     * Handle group conversation creation via socket
     */
    @OnEvent("create-group-conversation")
    public void onCreateGroupConversation(SocketIOClient client, SocketCreateGroupRequest request) {
        log.info("🔥 Received create group conversation event from client: {}", client.getSessionId());

        try {
            String creatorId = getUserIdFromClient(client);
            if (creatorId == null) {
                client.sendEvent("create-group-error", "User not authenticated");
                return;
            }

            // Validate request
            if (request.getGroupName() == null || request.getGroupName().trim().isEmpty()) {
                client.sendEvent("create-group-error", "Group name is required");
                return;
            }

            if (request.getParticipantIds() == null
                    || request.getParticipantIds().isEmpty()) {
                client.sendEvent("create-group-error", "At least one participant is required");
                return;
            }

            log.info(
                    "🔥 Processing group creation: '{}' with creator: {} and participants: {}",
                    request.getGroupName(),
                    creatorId,
                    request.getParticipantIds());

            // Create group conversation via socket
            chatMessageService.createSocketGroupConversation(
                    request.getGroupName(), request.getGroupAvatar(), request.getParticipantIds(), creatorId);

            // Send success response to creator
            client.sendEvent(
                    "create-group-success",
                    Map.of("message", "Group conversation created successfully", "groupName", request.getGroupName()));

            log.info("🔥 Group conversation '{}' created successfully by user: {}", request.getGroupName(), creatorId);

        } catch (Exception e) {
            log.error("🔥 Error creating group conversation", e);
            client.sendEvent("create-group-error", "Failed to create group conversation: " + e.getMessage());
        }
    }

    @OnEvent("add-participants")
    public void onAddParticipants(SocketIOClient client, AddParticipantsRequest request) {
        log.info("🔥 Received add participants event from client: {}", client.getSessionId());
        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("add-participants-error", "User not authenticated");
                return;
            }

            // Validate request data
            if (request.getConversationId() == null
                    || request.getConversationId().trim().isEmpty()) {
                client.sendEvent("add-participants-error", "Conversation ID is required");
                return;
            }

            if (request.getParticipantIds() == null
                    || request.getParticipantIds().isEmpty()) {
                client.sendEvent("add-participants-error", "At least one participant is required");
                return;
            }

            log.info("🔥 Adding participants to conversation: {} by user: {}", request.getConversationId(), userId);

            // Pass userId directly to the service method (don't rely on SecurityContext in socket events)
            ConversationResponse updatedConversation =
                    conversationService.addMembersToGroup(request.getConversationId(), request, userId);

            client.sendEvent(
                    "add-participants-success",
                    Map.of(
                            "message", "Participants added successfully",
                            "conversationId", request.getConversationId(),
                            "participants", updatedConversation.getParticipants()));

            log.info(
                    "🔥 Successfully added {} participants to conversation: {}",
                    request.getParticipantIds().size(),
                    request.getConversationId());

        } catch (Exception e) {
            log.error(
                    "🔥 Error adding participants to conversation: {}",
                    request != null ? request.getConversationId() : "unknown",
                    e);
            client.sendEvent("add-participants-error", "Failed to add participants: " + e.getMessage());
        }
    }

    @OnEvent("remove-participants")
    public void onRemoveParticipants(SocketIOClient client, RemoveParticipantsRequest request) {
        log.info("🔥 Received remove participants event from client: {}", client.getSessionId());
        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("remove-participants-error", "User not authenticated");
                return;
            }

            // Validate request data
            if (request.getConversationId() == null
                    || request.getConversationId().trim().isEmpty()) {
                client.sendEvent("remove-participants-error", "Conversation ID is required");
                return;
            }

            if (request.getParticipantIds() == null
                    || request.getParticipantIds().isEmpty()) {
                client.sendEvent("remove-participants-error", "At least one participant is required");
                return;
            }

            log.info("🔥 Removing participants from conversation: {} by user: {}", request.getConversationId(), userId);

            // Create a proper request object for the service
            RemoveParticipantsRequest serviceRequest = RemoveParticipantsRequest.builder()
                    .participantIds(request.getParticipantIds())
                    .build();

            conversationService.removeMembersFromGroup(request.getConversationId(), serviceRequest, userId);

            client.sendEvent(
                    "remove-participants-success",
                    Map.of(
                            "message",
                            "Participants removed successfully",
                            "conversationId",
                            request.getConversationId()));

            log.info(
                    "🔥 Successfully removed {} participants from conversation: {}",
                    request.getParticipantIds().size(),
                    request.getConversationId());

        } catch (Exception e) {
            log.error(
                    "🔥 Error removing participants from conversation: {}",
                    request != null ? request.getConversationId() : "unknown",
                    e);
            client.sendEvent("remove-participants-error", "Failed to remove participants: " + e.getMessage());
        }
    }

    @OnEvent("leave-group")
    public void onLeaveGroup(SocketIOClient client, LeaveGroupRequest request) {
        log.info("🔥 Received leave group event from client: {}", client.getSessionId());
        try {
            String userId = getUserIdFromClient(client);
            if (userId == null) {
                client.sendEvent("leave-group-error", "User not authenticated");
                return;
            }

            // Validate request data
            if (request.getConversationId() == null
                    || request.getConversationId().trim().isEmpty()) {
                client.sendEvent("leave-group-error", "Conversation ID is required");
                return;
            }

            log.info("🔥 User {} leaving group conversation: {}", userId, request.getConversationId());

            conversationService.leaveGroup(request.getConversationId(), userId);

            client.sendEvent(
                    "leave-group-success",
                    Map.of("message", "Successfully left the group", "conversationId", request.getConversationId()));

            log.info("🔥 User {} successfully left group conversation: {}", userId, request.getConversationId());

        } catch (Exception e) {
            log.error(
                    "🔥 Error leaving group conversation: {}",
                    request != null ? request.getConversationId() : "unknown",
                    e);
            client.sendEvent("leave-group-error", "Failed to leave group: " + e.getMessage());
        }
    }

    @OnEvent("edit-group-info")
    public void onEditGroupInfo(SocketIOClient client, SocketEditGroupInfoRequest request) {
        log.info("Client editing group info: {} for conversation: {}",
                client.getSessionId(), request.getConversationId());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(
                client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();

                // Validate request
                if (request.getConversationId() == null || request.getConversationId().trim().isEmpty()) {
                    client.sendEvent("group-info-edit-error", "Conversation ID is required");
                    return;
                }

                // At least one field must be provided
                if ((request.getGroupName() == null || request.getGroupName().trim().isEmpty()) &&
                    (request.getGroupAvatar() == null || request.getGroupAvatar().trim().isEmpty())) {
                    client.sendEvent("group-info-edit-error", "Either group name or group avatar must be provided");
                    return;
                }

                log.info("Processing group info edit - Name: '{}', Avatar URL: '{}'",
                        request.getGroupName(), request.getGroupAvatar());

                // Create EditGroupInfoRequest from socket request
                EditGroupInfoRequest editRequest = EditGroupInfoRequest.builder()
                        .groupName(request.getGroupName() != null && !request.getGroupName().trim().isEmpty()
                                ? request.getGroupName().trim() : null)
                        .groupAvatar(request.getGroupAvatar() != null && !request.getGroupAvatar().trim().isEmpty()
                                ? request.getGroupAvatar().trim() : null)
                        .build();

                // Edit group info - this creates system messages and updates conversation
                ConversationResponse updatedConversation = conversationService.editGroupInfo(
                        request.getConversationId(), editRequest, userId);

                // Broadcast the updated conversation to all group members (includes system messages)
                chatMessageService.broadcastGroupInfoUpdate(request.getConversationId(), updatedConversation);

                // Send success response back to the client who made the change
                client.sendEvent("group-info-edit-success", updatedConversation);

                log.info("Group info edited successfully for conversation: {} - Name: '{}', Avatar: '{}'",
                        request.getConversationId(), updatedConversation.getGroupName(),
                        updatedConversation.getGroupAvatar());

            } catch (Exception e) {
                log.error("Error editing group info for conversation: {}", request.getConversationId(), e);
                client.sendEvent("group-info-edit-error", "Failed to edit group info: " + e.getMessage());
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("group-info-edit-error", "Invalid session");
        }
    }
    @OnEvent("forward-message")
    public void onForwardMessage(SocketIOClient client, com.devteria.chat.dto.request.ForwardMessageRequest request) {
        log.info("Client forwarding message: {} to conversation: {}", request.getMessageId(), request.getToConversationId());

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();
                if (!userId.equals(request.getFromUserId())) {
                    client.sendEvent("forward-message-error", "Invalid user session");
                    return;
                }
                var response = chatMessageService.forwardMessage(request);
                client.sendEvent("forward-message-success", response);
            } catch (Exception e) {
                log.error("Error forwarding message {} to conversation {}", request.getMessageId(), request.getToConversationId(), e);
                client.sendEvent("forward-message-error", "Failed to forward message");
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("forward-message-error", "Invalid session");
        }
    }
        @OnEvent("edit-message")
    public void onEditMessage(SocketIOClient client, Map<String, Object> data) {
        log.info("Client editing message: {}", data);

        // Get the user session
        var webSocketSession = webSocketSessionService.getSessionBySocketId(client.getSessionId().toString());
        if (webSocketSession.isPresent()) {
            try {
                String userId = webSocketSession.get().getUserId();
                String messageId = (String) data.get("messageId");
                String newContent = (String) data.get("message");
                String conversationId = (String) data.get("conversationId");
                if (messageId == null || newContent == null || conversationId == null) {
                    client.sendEvent("edit-message-error", "Missing required fields");
                    return;
                }
                var response = chatMessageService.editMessage(messageId, newContent, userId, conversationId);
                client.sendEvent("edit-message-success", response);
            } catch (Exception e) {
                log.error("Error editing message {}", data, e);
                client.sendEvent("edit-message-error", "Failed to edit message");
            }
        } else {
            log.warn("No WebSocket session found for socket: {}", client.getSessionId());
            client.sendEvent("edit-message-error", "Invalid session");
        }
    }

    @PostConstruct
    public void startServer() {
        server.start();
        server.addListeners(this);
        log.info("Socket server started");
    }

    @PreDestroy
    public void stopServer() {
        server.stop();
        log.info("Socket server stoped");
    }
}
