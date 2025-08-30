package com.devteria.chat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.devteria.chat.dto.request.ForwardMessageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.corundumstudio.socketio.SocketIOServer;
import com.devteria.chat.dto.request.ChatMessageRequest;
import com.devteria.chat.dto.request.ReplyMessageRequest;
import com.devteria.chat.dto.request.SocketMediaMessageRequest;
import com.devteria.chat.dto.response.ChatMessageResponse;
import com.devteria.chat.dto.response.ConversationResponse;
import com.devteria.chat.entity.ChatMessage;
import com.devteria.chat.entity.Conversation;
import com.devteria.chat.entity.ParticipantInfo;
import com.devteria.chat.entity.WebSocketSession;
import com.devteria.chat.exception.AppException;
import com.devteria.chat.exception.ErrorCode;
import com.devteria.chat.mapper.ChatMessageMapper;
import com.devteria.chat.repository.ChatMessageRepository;
import com.devteria.chat.repository.ConversationRepository;
import com.devteria.chat.repository.WebSocketSessionRepository;
import com.devteria.chat.repository.httpclient.ProfileClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatMessageService {
    SocketIOServer socketIOServer;

    ChatMessageRepository chatMessageRepository;
    ConversationRepository conversationRepository;
    WebSocketSessionRepository webSocketSessionRepository;
    ProfileClient profileClient;

    ObjectMapper objectMapper;
    ChatMessageMapper chatMessageMapper;

    WebSocketSessionService webSo;
    MessageReactionService messageReactionService; // Add message reaction service

    public List<ChatMessageResponse> getMessages(String conversationId) {
        // Validate conversationId
        String userId = getCurrentUserId();
        conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND))
                .getParticipants()
                .stream()
                .filter(participantInfo -> userId.equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(conversationId);

        var result = messages.stream()
                .map(message -> toChatMessageResponse(message, userId))
                .toList();

        log.info("Found {} messages for conversation: {}", result.size(), conversationId);

        // Debug logging for recall messages
        result.forEach(msg -> {
            if (msg.isRecalled()) {
                log.info(
                        "Recalled message found: id={}, isRecalled={}, recallType={}, message='{}'",
                        msg.getId(),
                        msg.isRecalled(),
                        msg.getRecallType(),
                        msg.getMessage());
            }
        });

        return result;
    }

    public ChatMessageResponse create(ChatMessageRequest request) {
        String userId = getCurrentUserId();
        return createMessage(request, null, "TEXT", userId);
    }

    public ChatMessageResponse createReply(ReplyMessageRequest request, String userId) {
        // Validate reply to message exists and belongs to the conversation
        var replyToMessage = chatMessageRepository
                .findById(request.getReplyToMessageId())
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        if (!replyToMessage.getConversationId().equals(request.getConversationId())) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        return createMessage(request, request.getReplyToMessageId(), "REPLY", userId);
    }

    private String getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return authentication.getName();
    }

    private ChatMessageResponse createMessage(
            Object request, String replyToMessageId, String messageType, String userId) {
        // Extract common properties from request
        String conversationId;
        String message;

        if (request instanceof ChatMessageRequest chatRequest) {
            conversationId = chatRequest.getConversationId();
            message = chatRequest.getMessage();
        } else if (request instanceof ReplyMessageRequest replyRequest) {
            conversationId = replyRequest.getConversationId();
            message = replyRequest.getMessage();
        } else {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Validate conversationId
        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        conversation.getParticipants().stream()
                .filter(participantInfo -> userId.equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Get UserInfo from ProfileService
        var userResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userResponse.getResult();

        // Initialize readers list with sender (who has implicitly read their own message)
        ParticipantInfo senderInfo = ParticipantInfo.builder()
                .userId(userInfo.getUserId())
                .username(userInfo.getUsername())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatar(userInfo.getAvatar())
                .build();

        // Build Chat message Info
        ChatMessage chatMessage = ChatMessage.builder()
                .conversationId(conversationId)
                .message(message)
                .replyToMessageId(replyToMessageId)
                .type(messageType)
                .createdDate(Instant.now())
                .sender(ParticipantInfo.builder()
                        .userId(userInfo.getUserId())
                        .username(userInfo.getUsername())
                        .firstName(userInfo.getFirstName())
                        .lastName(userInfo.getLastName())
                        .avatar(userInfo.getAvatar())
                        .build())
                .build();

        // Handle different conversation types
        if ("GROUP".equals(conversation.getType())) {
            // For group conversations, sender always reads their own message
            chatMessage.setStatus("SENT");
            chatMessage.setReadDate(null);
            chatMessage.setReader(null);
            chatMessage.setReaders(new ArrayList<>(List.of(senderInfo))); // Only sender has read it initially
        } else {
            // For direct conversations, handle receiver logic
            String receiverId = conversation.getParticipants().stream()
                    .filter(participant -> !participant.getUserId().equals(userId))
                    .map(ParticipantInfo::getUserId)
                    .findFirst()
                    .orElse(null);

            log.info("Receiver ID: {}", receiverId);

            // Check if receiver is actively viewing this conversation
            boolean isReceiverInConversation = webSo.isUserInConversation(receiverId, conversationId);
            log.info("User {} - receiver in conversation: {}", receiverId, isReceiverInConversation);

            if (isReceiverInConversation && receiverId != null) {
                chatMessage.setStatus("SEEN");
                chatMessage.setReadDate(Instant.now());

                var receiverResponse = profileClient.getProfile(receiverId);
                if (receiverResponse != null && receiverResponse.getResult() != null) {
                    var receiverInfo = receiverResponse.getResult();
                    ParticipantInfo readerInfo = ParticipantInfo.builder()
                            .userId(receiverInfo.getUserId())
                            .username(receiverInfo.getUsername())
                            .firstName(receiverInfo.getFirstName())
                            .lastName(receiverInfo.getLastName())
                            .avatar(receiverInfo.getAvatar())
                            .build();

                    chatMessage.setReader(readerInfo);
                    chatMessage.setReaders(new ArrayList<>(List.of(senderInfo, readerInfo))); // Both have read it
                } else {
                    chatMessage.setReaders(new ArrayList<>(List.of(senderInfo))); // Only sender has read it
                }
            } else {
                chatMessage.setStatus("SENT");
                chatMessage.setReadDate(null);
                chatMessage.setReader(null);
                chatMessage.setReaders(new ArrayList<>(List.of(senderInfo))); // Only sender has read it
            }
        }

        // Create chat message
        chatMessage = chatMessageRepository.save(chatMessage);

        // Update conversation lastMessage and typeMessage
        conversation.setLastMessage(chatMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Broadcast to WebSocket clients - PASS userId parameter here
        broadcastMessage(chatMessage, conversation, userId, messageType);

        // convert to Response - PASS userId parameter here
        return toChatMessageResponse(chatMessage, userId);
    }

    public void broadcastAddMembersMessage(
            Conversation conversation, String adderId, List<ParticipantInfo> addedMembers, String groupName) {

        // Get adder's name - make it effectively final
        var adderResponse = profileClient.getProfile(adderId);
        final String adderName;
        if (adderResponse != null && adderResponse.getResult() != null) {
            var adderInfo = adderResponse.getResult();
            adderName = adderInfo.getFirstName() + " " + adderInfo.getLastName();
        } else {
            adderName = "Someone";
        }

        // Get added members' names - make it effectively final
        final String addedMembersNames = addedMembers.stream()
                .map(member -> member.getFirstName() + " " + member.getLastName())
                .collect(Collectors.joining(", "));

        final List<String> addedMemberIds =
                addedMembers.stream().map(ParticipantInfo::getUserId).toList();

        // Create metadata for personalization
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("adderId", adderId);
        metadata.put("adderName", adderName);
        metadata.put("addedMemberIds", addedMemberIds);
        metadata.put("addedMembersNames", addedMembersNames);
        metadata.put("groupName", groupName);

        // Get adder's profile info for readers list
        ParticipantInfo adderReaderInfo = null;
        if (adderResponse != null && adderResponse.getResult() != null) {
            var adderInfo = adderResponse.getResult();
            adderReaderInfo = ParticipantInfo.builder()
                    .userId(adderInfo.getUserId())
                    .username(adderInfo.getUsername())
                    .firstName(adderInfo.getFirstName())
                    .lastName(adderInfo.getLastName())
                    .avatar(adderInfo.getAvatar())
                    .build();
        }

        // Create and save a single system message with metadata
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message("SYSTEM_ADD_MEMBERS") // Template message that will be personalized
                .type("SYSTEM_ADD_MEMBERS")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(adderReaderInfo != null ? new ArrayList<>(List.of(adderReaderInfo)) : new ArrayList<>()) // Include creator in readers
                .build();

        try {
            // Store metadata as JSON string for personalization during retrieval
            String metadataJson = objectMapper.writeValueAsString(metadata);
            systemMessage.setMessage("SYSTEM_ADD_MEMBERS:" + metadataJson);
        } catch (JsonProcessingException e) {
            log.error("Error serializing metadata", e);
            // Fallback to generic message
            systemMessage.setMessage(adderName + " added " + addedMembersNames + " to " + groupName);
        }

        // Save the system message to database with JSON metadata
        final ChatMessage finalSystemMessage = chatMessageRepository.save(systemMessage);

        // Create a user-friendly display message for conversation list (NOT saved to database)
        String displayMessage = adderName + " added " + addedMembersNames + " to " + groupName;
        ChatMessage displayLastMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message(displayMessage)
                .type("SYSTEM")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(adderReaderInfo != null ? new ArrayList<>(List.of(adderReaderInfo)) : new ArrayList<>()) // Include creator in readers
                .build();

        // Update conversation lastMessage with user-friendly message (not the metadata)
        conversation.setLastMessage(displayLastMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Get all participants userIds for WebSocket broadcasting
        List<String> userIds = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList();

        Map<String, WebSocketSession> webSocketSessions = webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

        // Broadcast personalized messages via WebSocket
        socketIOServer.getAllClients().forEach(client -> {
            var webSocketSession = webSocketSessions.get(client.getSessionId().toString());

            if (Objects.nonNull(webSocketSession)) {
                try {
                    String currentUserId = webSocketSession.getUserId();

                    // Check if this user is a participant in the conversation
                    boolean isParticipant = conversation.getParticipants().stream()
                            .anyMatch(participant -> participant.getUserId().equals(currentUserId));

                    if (isParticipant) {
                        // Create personalized response for this user
                        ChatMessageResponse personalizedResponse = createPersonalizedAddMembersResponse(
                                finalSystemMessage,
                                currentUserId,
                                adderId,
                                adderName,
                                addedMemberIds,
                                addedMembersNames,
                                groupName);

                        String message = objectMapper.writeValueAsString(personalizedResponse);
                        client.sendEvent("message", message);
                    }

                } catch (JsonProcessingException e) {
                    log.error("Error serializing add-members response", e);
                }
            }
        });
    }

    /**
     * Create personalized add-members response for a specific user
     */
    private ChatMessageResponse createPersonalizedAddMembersResponse(
            ChatMessage systemMessage,
            String currentUserId,
            String adderId,
            String adderName,
            List<String> addedMemberIds,
            String addedMembersNames,
            String groupName) {

        String personalizedMessage;

        if (currentUserId.equals(adderId)) {
            // Message for the person who added members
            personalizedMessage = "You added " + addedMembersNames + " to " + groupName;
        } else if (addedMemberIds.contains(currentUserId)) {
            // Message for users who were added
            personalizedMessage = "You were added to " + groupName + " by " + adderName;
        } else {
            // Message for other existing members
            personalizedMessage = adderName + " added " + addedMembersNames + " to " + groupName;
        }

        // Create a temporary personalized message for response
        ChatMessage personalizedChatMessage = ChatMessage.builder()
                .id(systemMessage.getId()) // Use the same ID as the saved message
                .conversationId(systemMessage.getConversationId())
                .message(personalizedMessage)
                .type("SYSTEM_ADD_MEMBERS")
                .status("SENT")
                .sender(null)
                .createdDate(systemMessage.getCreatedDate())
                .readers(systemMessage.getReaders()) // Use the original readers list to preserve read status
                .build();

        return toChatMessageResponse(personalizedChatMessage, currentUserId);
    }

    public void broadcastRemoveMembersMessage(
            Conversation conversation, String removerId, List<ParticipantInfo> removedMembers, String groupName) {

        // Get remover's name - make it effectively final
        var removerResponse = profileClient.getProfile(removerId);
        final String removerName;
        if (removerResponse != null && removerResponse.getResult() != null) {
            var removerInfo = removerResponse.getResult();
            removerName = removerInfo.getFirstName() + " " + removerInfo.getLastName();
        } else {
            removerName = "Someone";
        }

        // Get removed members' names - make it effectively final
        final String removedMembersNames = removedMembers.stream()
                .map(member -> member.getFirstName() + " " + member.getLastName())
                .collect(Collectors.joining(", "));

        final List<String> removedMemberIds =
                removedMembers.stream().map(ParticipantInfo::getUserId).toList();

        // Create metadata for personalization
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("removerId", removerId);
        metadata.put("removerName", removerName);
        metadata.put("removedMemberIds", removedMemberIds);
        metadata.put("removedMembersNames", removedMembersNames);
        metadata.put("groupName", groupName);

        // Get remover's profile info for readers list
        ParticipantInfo removerReaderInfo = null;
        if (removerResponse != null && removerResponse.getResult() != null) {
            var removerInfo = removerResponse.getResult();
            removerReaderInfo = ParticipantInfo.builder()
                    .userId(removerInfo.getUserId())
                    .username(removerInfo.getUsername())
                    .firstName(removerInfo.getFirstName())
                    .lastName(removerInfo.getLastName())
                    .avatar(removerInfo.getAvatar())
                    .build();
        }

        // Create and save a single system message with metadata
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message("SYSTEM_REMOVE_MEMBERS") // Template message that will be personalized
                .type("SYSTEM_REMOVE_MEMBERS")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(removerReaderInfo != null ? new ArrayList<>(List.of(removerReaderInfo)) : new ArrayList<>()) // Include remover in readers
                .build();

        try {
            // Store metadata as JSON string for personalization during retrieval
            String metadataJson = objectMapper.writeValueAsString(metadata);
            systemMessage.setMessage("SYSTEM_REMOVE_MEMBERS:" + metadataJson);
        } catch (JsonProcessingException e) {
            log.error("Error serializing metadata", e);
            // Fallback to generic message
            systemMessage.setMessage(removerName + " removed " + removedMembersNames + " from " + groupName);
        }

        // Save the system message to database with JSON metadata
        final ChatMessage finalSystemMessage = chatMessageRepository.save(systemMessage);

        // Create a user-friendly display message for conversation list (NOT saved to database)
        String displayMessage = removerName + " removed " + removedMembersNames + " from " + groupName;
        ChatMessage displayLastMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message(displayMessage)
                .type("SYSTEM")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(removerReaderInfo != null ? new ArrayList<>(List.of(removerReaderInfo)) : new ArrayList<>()) // Include remover in readers
                .build();

        // Update conversation lastMessage with user-friendly message (not the metadata)
        conversation.setLastMessage(displayLastMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Get all participants userIds for WebSocket broadcasting
        List<String> allUserIds = new ArrayList<>();
        // Add current participants
        allUserIds.addAll(conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList());
        // Add removed members so they get notified
        allUserIds.addAll(removedMemberIds);

        Map<String, WebSocketSession> webSocketSessions =
                webSocketSessionRepository.findAllByUserIdIn(allUserIds).stream()
                        .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

        // Broadcast personalized messages via WebSocket
        socketIOServer.getAllClients().forEach(client -> {
            var webSocketSession = webSocketSessions.get(client.getSessionId().toString());

            if (Objects.nonNull(webSocketSession)) {
                try {
                    String currentUserId = webSocketSession.getUserId();

                    // Check if this user was a participant in the conversation (before or after removal)
                    boolean wasParticipant = conversation.getParticipants().stream()
                                    .anyMatch(participant ->
                                            participant.getUserId().equals(currentUserId))
                            || removedMemberIds.contains(currentUserId);

                    if (wasParticipant) {
                        // Create personalized response for this user
                        ChatMessageResponse personalizedResponse = createPersonalizedRemoveMembersResponse(
                                finalSystemMessage,
                                currentUserId,
                                removerId,
                                removerName,
                                removedMemberIds,
                                removedMembersNames,
                                groupName);

                        String message = objectMapper.writeValueAsString(personalizedResponse);
                        client.sendEvent("message", message);
                    }

                } catch (JsonProcessingException e) {
                    log.error("Error serializing remove-members response", e);
                }
            }
        });
    }

    /**
     * Create personalized remove-members response for a specific user
     */
    private ChatMessageResponse createPersonalizedRemoveMembersResponse(
            ChatMessage systemMessage,
            String currentUserId,
            String removerId,
            String removerName,
            List<String> removedMemberIds,
            String removedMembersNames,
            String groupName) {

        String personalizedMessage;

        if (currentUserId.equals(removerId)) {
            // Message for the person who removed members
            personalizedMessage = "You removed " + removedMembersNames + " from " + groupName;
        } else if (removedMemberIds.contains(currentUserId)) {
            // Message for users who were removed
            personalizedMessage = "You were removed from " + groupName + " by " + removerName;
        } else {
            // Message for other existing members
            personalizedMessage = removerName + " removed " + removedMembersNames + " from " + groupName;
        }

        // Create a temporary personalized message for response
        ChatMessage personalizedChatMessage = ChatMessage.builder()
                .id(systemMessage.getId()) // Use the same ID as the saved message
                .conversationId(systemMessage.getConversationId())
                .message(personalizedMessage)
                .type("SYSTEM_REMOVE_MEMBERS")
                .status("SENT")
                .sender(null)
                .createdDate(systemMessage.getCreatedDate())
                .readers(systemMessage.getReaders()) // Use the original readers list to preserve read status
                .build();

        return toChatMessageResponse(personalizedChatMessage, currentUserId);
    }

    public void broadcastLeaveGroupMessage(
            Conversation conversation, String leavingUserId, ParticipantInfo leavingMember, String groupName) {

        // Get leaving user's name - make it effectively final
        final String leavingUserName = leavingMember.getFirstName() + " " + leavingMember.getLastName();

        // Create metadata for personalization
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("leavingUserId", leavingUserId);
        metadata.put("leavingUserName", leavingUserName);
        metadata.put("groupName", groupName);

        // Create and save a single system message with metadata
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message("SYSTEM_LEAVE_GROUP") // Template message that will be personalized
                .type("SYSTEM_LEAVE_GROUP")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(new ArrayList<>())
                .build();

        try {
            // Store metadata as JSON string for personalization during retrieval
            String metadataJson = objectMapper.writeValueAsString(metadata);
            systemMessage.setMessage("SYSTEM_LEAVE_GROUP:" + metadataJson);
        } catch (JsonProcessingException e) {
            log.error("Error serializing metadata", e);
            // Fallback to generic message
            systemMessage.setMessage(leavingUserName + " left " + groupName);
        }

        // Save the system message to database with JSON metadata
        final ChatMessage finalSystemMessage = chatMessageRepository.save(systemMessage);

        // Create a user-friendly display message for conversation list (NOT saved to database)
        String displayMessage = leavingUserName + " left " + groupName;
        ChatMessage displayLastMessage = ChatMessage.builder()
                .conversationId(conversation.getId())
                .message(displayMessage)
                .type("SYSTEM")
                .status("SENT")
                .sender(null)
                .createdDate(Instant.now())
                .readers(new ArrayList<>())
                .build();

        // Update conversation lastMessage with user-friendly message (not the metadata)
        conversation.setLastMessage(displayLastMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Get all participants userIds for WebSocket broadcasting (including the leaving user for notification)
        List<String> allUserIds = new ArrayList<>();
        // Add current participants (after the user left)
        allUserIds.addAll(conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList());
        // Add the leaving user so they get notified
        allUserIds.add(leavingUserId);

        Map<String, WebSocketSession> webSocketSessions =
                webSocketSessionRepository.findAllByUserIdIn(allUserIds).stream()
                        .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

        // Broadcast personalized messages via WebSocket
        socketIOServer.getAllClients().forEach(client -> {
            var webSocketSession = webSocketSessions.get(client.getSessionId().toString());

            if (Objects.nonNull(webSocketSession)) {
                try {
                    String currentUserId = webSocketSession.getUserId();

                    // Create personalized response for this user
                    ChatMessageResponse personalizedResponse = createPersonalizedLeaveGroupResponse(
                            finalSystemMessage, currentUserId, leavingUserId, leavingUserName, groupName);

                    String message = objectMapper.writeValueAsString(personalizedResponse);
                    client.sendEvent("message", message);

                } catch (JsonProcessingException e) {
                    log.error("Error serializing leave-group response", e);
                }
            }
        });
    }

    /**
     * Create personalized leave-group response for a specific user
     */
    private ChatMessageResponse createPersonalizedLeaveGroupResponse(
            ChatMessage systemMessage,
            String currentUserId,
            String leavingUserId,
            String leavingUserName,
            String groupName) {

        String personalizedMessage;

        if (currentUserId.equals(leavingUserId)) {
            // Message for the person who left the group
            personalizedMessage = "You left " + groupName;
        } else {
            // Message for remaining members
            personalizedMessage = leavingUserName + " left " + groupName;
        }

        // Create a temporary personalized message for response
        ChatMessage personalizedChatMessage = ChatMessage.builder()
                .id(systemMessage.getId()) // Use the same ID as the saved message
                .conversationId(systemMessage.getConversationId())
                .message(personalizedMessage)
                .type("SYSTEM_LEAVE_GROUP")
                .status("SENT")
                .sender(null)
                .createdDate(systemMessage.getCreatedDate())
                .readers(new ArrayList<>())
                .build();

        return toChatMessageResponse(personalizedChatMessage, currentUserId);
    }

    public void broadcastMessage(
            ChatMessage chatMessage, Conversation conversation, String senderId, String messageType) {
        // Get participants userIds
        List<String> userIds = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList();

        Map<String, WebSocketSession> webSocketSessions = webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

        final ChatMessage finalChatMessage = chatMessage;

        // Determine the event name based on message type
        String eventName = "REPLY".equals(messageType) ? "reply-message" : "message";

        socketIOServer.getAllClients().forEach(client -> {
            var webSocketSession = webSocketSessions.get(client.getSessionId().toString());

            if (Objects.nonNull(webSocketSession)) {
                try {
                    // Create response for each client with their own userId context
                    ChatMessageResponse chatMessageResponse =
                            toChatMessageResponse(finalChatMessage, webSocketSession.getUserId());
                    chatMessageResponse.setMe(webSocketSession.getUserId().equals(senderId));
                    // Only set read info if the message was seen
                    chatMessageResponse.setReader(finalChatMessage.getReader());

                    String message = objectMapper.writeValueAsString(chatMessageResponse);
                    client.sendEvent(eventName, message);
                } catch (JsonProcessingException e) {
                    log.error("Error serializing {} response", messageType.toLowerCase(), e);
                }
            }
        });
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = chatMessageMapper.toChatMessageResponse(chatMessage);

        // Handle system messages with null sender
        if (chatMessage.getSender() != null) {
            chatMessageResponse.setMe(userId.equals(chatMessage.getSender().getUserId()));
        } else {
            chatMessageResponse.setMe(false); // System messages are never "me"
        }

        // Handle personalization for SYSTEM_ADD_MEMBERS messages
        if ("SYSTEM_ADD_MEMBERS".equals(chatMessage.getType())
                && chatMessage.getMessage().startsWith("SYSTEM_ADD_MEMBERS:")) {
            try {
                // Extract metadata from message
                String metadataJson = chatMessage.getMessage().substring("SYSTEM_ADD_MEMBERS:".length());
                Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);

                String adderId = (String) metadata.get("adderId");
                String adderName = (String) metadata.get("adderName");
                List<String> addedMemberIds = (List<String>) metadata.get("addedMemberIds");
                String addedMembersNames = (String) metadata.get("addedMembersNames");
                String groupName = (String) metadata.get("groupName");

                // Generate personalized message based on current user's role
                String personalizedMessage;
                if (userId.equals(adderId)) {
                    personalizedMessage = "You added " + addedMembersNames + " to " + groupName;
                } else if (addedMemberIds.contains(userId)) {
                    personalizedMessage = "You were added to " + groupName + " by " + adderName;
                } else {
                    personalizedMessage = adderName + " added " + addedMembersNames + " to " + groupName;
                }

                chatMessageResponse.setMessage(personalizedMessage);
            } catch (Exception e) {
                log.error("Error personalizing add-members message", e);
                // Fallback to generic message if personalization fails
                chatMessageResponse.setMessage("Members were added to the group");
            }
        }

        // Handle personalization for SYSTEM_REMOVE_MEMBERS messages
        if ("SYSTEM_REMOVE_MEMBERS".equals(chatMessage.getType())
                && chatMessage.getMessage().startsWith("SYSTEM_REMOVE_MEMBERS:")) {
            try {
                // Extract metadata from message
                String metadataJson = chatMessage.getMessage().substring("SYSTEM_REMOVE_MEMBERS:".length());
                Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);

                String removerId = (String) metadata.get("removerId");
                String removerName = (String) metadata.get("removerName");
                List<String> removedMemberIds = (List<String>) metadata.get("removedMemberIds");
                String removedMembersNames = (String) metadata.get("removedMembersNames");
                String groupName = (String) metadata.get("groupName");

                // Generate personalized message based on current user's role
                String personalizedMessage;
                if (userId.equals(removerId)) {
                    personalizedMessage = "You removed " + removedMembersNames + " from " + groupName;
                } else if (removedMemberIds.contains(userId)) {
                    personalizedMessage = "You were removed from " + groupName + " by " + removerName;
                } else {
                    personalizedMessage = removerName + " removed " + removedMembersNames + " from " + groupName;
                }

                chatMessageResponse.setMessage(personalizedMessage);
            } catch (Exception e) {
                log.error("Error personalizing remove-members message", e);
                // Fallback to generic message if personalization fails
                chatMessageResponse.setMessage("Members were removed from the group");
            }
        }

        // Handle personalization for SYSTEM_LEAVE_GROUP messages
        if ("SYSTEM_LEAVE_GROUP".equals(chatMessage.getType())
                && chatMessage.getMessage().startsWith("SYSTEM_LEAVE_GROUP:")) {
            try {
                // Extract metadata from message
                String metadataJson = chatMessage.getMessage().substring("SYSTEM_LEAVE_GROUP:".length());
                Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);

                String leavingUserId = (String) metadata.get("leavingUserId");
                String leavingUserName = (String) metadata.get("leavingUserName");
                String groupName = (String) metadata.get("groupName");

                // Generate personalized message based on current user's role
                String personalizedMessage;
                if (userId.equals(leavingUserId)) {
                    personalizedMessage = "You left " + groupName;
                } else {
                    personalizedMessage = leavingUserName + " left " + groupName;
                }

                chatMessageResponse.setMessage(personalizedMessage);
            } catch (Exception e) {
                log.error("Error personalizing leave-group message", e);
                // Fallback to generic message if personalization fails
                chatMessageResponse.setMessage("A member left the group");
            }
        }

        // Handle recall logic - show appropriate message based on recall type and current user
        if (chatMessage.isRecalled()) {
            if ("self".equals(chatMessage.getRecallType())) {
                // For "self" recall type
                if (userId.equals(chatMessage.getRecalledBy())) {
                    // Show "Message has been recalled" to the person who recalled it
                    chatMessageResponse.setMessage("Message has been recalled");
                } else {
                    // Show original message to others and hide recall status
                    chatMessageResponse.setMessage(chatMessage.getOriginalMessage());
                    chatMessageResponse.setRecalled(false);
                    chatMessageResponse.setRecallType(null);
                    chatMessageResponse.setRecalledBy(null);
                    chatMessageResponse.setRecalledDate(null);
                }
            } else if ("everyone".equals(chatMessage.getRecallType())) {
                // For "everyone" recall type, show "Message has been recalled" to all users
                chatMessageResponse.setMessage("Message has been recalled");
            }
        }

        // Set both single reader (for backward compatibility) and readers list for group conversations
        chatMessageResponse.setReader(chatMessage.getReader());
        chatMessageResponse.setReaders(chatMessage.getReaders());

        // If this is a reply message, fetch and include the original message
        if (chatMessage.getReplyToMessageId() != null) {
            var replyToMessage = chatMessageRepository.findById(chatMessage.getReplyToMessageId());
            if (replyToMessage.isPresent()) {
                var replyToResponse = chatMessageMapper.toChatMessageResponse(replyToMessage.get());

                // Handle null sender for reply messages too
                if (replyToMessage.get().getSender() != null) {
                    replyToResponse.setMe(
                            userId.equals(replyToMessage.get().getSender().getUserId()));
                } else {
                    replyToResponse.setMe(false); // System messages are never "me"
                }

                // Apply recall logic to reply message as well
                if (replyToMessage.get().isRecalled()) {
                    if ("self".equals(replyToMessage.get().getRecallType())) {
                        if (userId.equals(replyToMessage.get().getRecalledBy())) {
                            replyToResponse.setMessage("Message has been recalled");
                        } else {
                            replyToResponse.setMessage(replyToMessage.get().getOriginalMessage());
                            replyToResponse.setRecalled(false);
                            replyToResponse.setRecallType(null);
                            replyToResponse.setRecalledBy(null);
                            replyToResponse.setRecalledDate(null);
                        }
                    } else if ("everyone".equals(replyToMessage.get().getRecallType())) {
                        replyToResponse.setMessage("Message has been recalled");
                    }
                }

                // Set readers for reply message too
                replyToResponse.setReader(replyToMessage.get().getReader());
                replyToResponse.setReaders(replyToMessage.get().getReaders());

                // Include reactions for reply message too
                replyToResponse.setReactions(messageReactionService.getMessageReactionsSummary(
                        replyToMessage.get().getId(), userId));
                chatMessageResponse.setReplyToMessage(replyToResponse);
            }
        }

        // Include reaction summary for the message
        chatMessageResponse.setReactions(
                messageReactionService.getMessageReactionsSummary(chatMessage.getId(), userId));

        // Special handling for system messages to include reaction updates
        if ("SYSTEM".equals(chatMessage.getType())) {
            chatMessageResponse.setReactions(
                    messageReactionService.getMessageReactionsSummary(chatMessage.getId(), userId));
        }

        return chatMessageResponse;
    }

    public void markMessagesAsRead(String conversationId) {
        markMessagesAsReadInternal(conversationId);
    }

    public List<ChatMessage> markMessagesAsReadAndGetUpdated(String conversationId, String userId) {
        return markMessagesAsReadInternal(conversationId, userId);
    }

    private List<ChatMessage> markMessagesAsReadInternal(String conversationId) {
        return markMessagesAsReadInternal(conversationId, null);
    }

    private List<ChatMessage> markMessagesAsReadInternal(String conversationId, String providedUserId) {
        String userId = providedUserId != null ? providedUserId : getCurrentUserId();

        log.info("markMessagesAsReadInternal called - conversationId: {}, userId: {}", conversationId, userId);

        // Validate that user is part of the conversation
        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        conversation.getParticipants().stream()
                .filter(participantInfo -> userId.equals(participantInfo.getUserId()))
                .findAny()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Get user info for reader field
        var userResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userResponse.getResult();

        ParticipantInfo readerInfo = ParticipantInfo.builder()
                .userId(userInfo.getUserId())
                .username(userInfo.getUsername())
                .firstName(userInfo.getFirstName())
                .lastName(userInfo.getLastName())
                .avatar(userInfo.getAvatar())
                .build();

        // Find all unread messages in this conversation that were NOT sent by current user
        List<ChatMessage> unreadMessages = chatMessageRepository.findAllByConversationIdAndSenderUserIdNotAndStatusNot(
                conversationId, userId, "SEEN");

        log.info(
                "Query parameters - conversationId: {}, excludeSenderUserId: {}, excludeStatus: SEEN",
                conversationId,
                userId);
        log.info("Found {} unread messages for user {}", unreadMessages.size(), userId);

        // Mark all unread messages as SEEN and handle both direct and group conversations
        unreadMessages.forEach(message -> {
            log.info("Marking message {} as SEEN (was: {})", message.getId(), message.getStatus());

            // For direct conversations (backward compatibility)
            if ("DIRECT".equals(conversation.getType())) {
                message.setStatus("SEEN");
                message.setReadDate(Instant.now());
                message.setReader(readerInfo);
            } else if ("GROUP".equals(conversation.getType())) {
                // For group conversations, add user to readers list if not already present
                if (message.getReaders() == null) {
                    message.setReaders(new ArrayList<>());
                }

                // Check if user already read this message
                boolean alreadyRead = message.getReaders().stream()
                        .anyMatch(reader -> reader.getUserId().equals(userId));

                if (!alreadyRead) {
                    message.getReaders().add(readerInfo);
                    log.info("Added user {} to readers list for message {}", userId, message.getId());
                }

                // Update status to SEEN and set read date
                message.setStatus("SEEN");
                message.setReadDate(Instant.now());

                // For group messages, also keep the single reader field for the first reader (backward compatibility)
                if (message.getReader() == null) {
                    message.setReader(readerInfo);
                }
            }
        });

        // Save all updated messages
        if (!unreadMessages.isEmpty()) {
            chatMessageRepository.saveAll(unreadMessages);
            log.info("Saved {} updated messages", unreadMessages.size());
        }

        return unreadMessages;
    }

    public void broadcastMessageStatusUpdate(String conversationId, List<ChatMessage> updatedMessages) {
        log.info("Starting to broadcast message status update for conversation: {}", conversationId);

        // Get conversation to find participants
        var conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Get participants userIds
        List<String> userIds = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList();

        log.info("Conversation participants: {}", userIds);

        Map<String, WebSocketSession> webSocketSessions = webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

        log.info("Found {} websocket sessions for participants", webSocketSessions.size());

        // Create status update object with message IDs and status info
        var statusUpdate = Map.of(
                "conversationId",
                conversationId,
                "messageIds",
                updatedMessages.stream().map(ChatMessage::getId).toList(),
                "status",
                "SEEN",
                "readDate",
                Instant.now().toString());

        log.info("Status update payload: {}", statusUpdate);

        // Broadcast status update to all connected clients
        int sentCount = 0;
        for (var client : socketIOServer.getAllClients()) {
            var webSocketSession = webSocketSessions.get(client.getSessionId().toString());

            if (Objects.nonNull(webSocketSession)) {
                try {
                    String message = objectMapper.writeValueAsString(statusUpdate);
                    client.sendEvent("message-status-update", message);
                    sentCount++;
                    log.info(
                            "Sent message-status-update to client: {} (user: {})",
                            client.getSessionId(),
                            webSocketSession.getUserId());
                } catch (JsonProcessingException e) {
                    log.error("Error serializing message status update for client: {}", client.getSessionId(), e);
                }
            } else {
                log.debug("Skipping client {} - not a conversation participant", client.getSessionId());
            }
        }

        log.info("Successfully sent message-status-update to {} clients", sentCount);
    }

    public void broadcastReactionUpdate(String messageId, String userId) {
        try {
            // Get the message to find its conversation
            var chatMessage = chatMessageRepository.findById(messageId);
            if (chatMessage.isEmpty()) {
                log.error("Message not found: {}", messageId);
                return;
            }

            var message = chatMessage.get();
            String conversationId = message.getConversationId();

            // Get conversation to find participants
            var conversation = conversationRepository
                    .findById(conversationId)
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Get participants userIds
            List<String> userIds = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .toList();

            Map<String, WebSocketSession> webSocketSessions =
                    webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                            .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

            // Broadcast to all connected clients who are participants in this conversation
            socketIOServer.getAllClients().forEach(client -> {
                var webSocketSession =
                        webSocketSessions.get(client.getSessionId().toString());
                if (Objects.nonNull(webSocketSession)) {
                    try {
                        // Calculate reaction summary for THIS specific user (not the reactor)
                        String recipientUserId = webSocketSession.getUserId();
                        var reactionSummary =
                                messageReactionService.getMessageReactionsSummary(messageId, recipientUserId);

                        // Create reaction update payload with correct reactedByMe flag for this user
                        var reactionUpdate = Map.of(
                                "messageId", messageId,
                                "conversationId", conversationId,
                                "reactions", reactionSummary);

                        String reactionUpdateJson = objectMapper.writeValueAsString(reactionUpdate);
                        client.sendEvent("reaction-update", reactionUpdateJson);

                        log.debug(
                                "Sent reaction update to client: {} (user: {}) with reactedByMe calculated for user: {}",
                                client.getSessionId(),
                                recipientUserId,
                                recipientUserId);
                    } catch (Exception e) {
                        log.error("Error sending reaction update to client: {}", client.getSessionId(), e);
                    }
                }
            });

            log.info("Broadcasted reaction update for message: {} to {} participants", messageId, userIds.size());

        } catch (Exception e) {
            log.error("Error broadcasting reaction update for message: {}", messageId, e);
        }
    }

    public ChatMessageResponse recallMessage(String messageId, String userId, String recallType) {
        // Find the message
        ChatMessage message = chatMessageRepository
                .findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify that the user is the sender of the message
        if (message.getSender() == null || !message.getSender().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if message is already recalled
        if (message.isRecalled()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Store original message content before recall
        message.setOriginalMessage(message.getMessage());
        message.setRecalled(true);
        message.setRecallType(recallType);
        message.setRecalledBy(userId);
        message.setRecalledDate(Instant.now());

        // Set appropriate recall message based on type
        if ("self".equals(recallType)) {
            message.setMessage("Message has been recalled");
        } else if ("everyone".equals(recallType)) {
            message.setMessage("Message has been recalled");
        }

        // Save the recalled message
        message = chatMessageRepository.save(message);

        // Get conversation for broadcasting
        var conversation = conversationRepository
                .findById(message.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Update conversation's lastMessage if the recalled message is the last message
        if (conversation.getLastMessage() != null
                && conversation.getLastMessage().getId().equals(message.getId())) {
            log.info(
                    "🔥 UPDATING CONVERSATION LAST MESSAGE: Before update - isRecalled: {}, message: '{}'",
                    conversation.getLastMessage().isRecalled(),
                    conversation.getLastMessage().getMessage());

            conversation.setLastMessage(message);
            conversation.setModifiedDate(Instant.now());
            var result = conversationRepository.save(conversation);

            log.info(
                    "🔥 UPDATED CONVERSATION LAST MESSAGE: After update - isRecalled: {}, message: '{}'",
                    result.getLastMessage().isRecalled(),
                    result.getLastMessage().getMessage());
        } else {
            log.warn(
                    "🔥 CONVERSATION LAST MESSAGE NOT UPDATED: lastMessage ID: {}, recalled message ID: {}",
                    conversation.getLastMessage() != null
                            ? conversation.getLastMessage().getId()
                            : "null",
                    message.getId());
        }

        // Broadcast the recall to all participants
        broadcastRecallMessage(message, conversation, userId);

        return toChatMessageResponse(message, userId);
    }

    private void broadcastRecallMessage(ChatMessage recalledMessage, Conversation conversation, String recallerUserId) {
        try {
            // Get participants userIds
            List<String> userIds = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .toList();

            Map<String, WebSocketSession> webSocketSessions =
                    webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                            .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

            // Broadcast to all connected clients who are participants in this conversation
            socketIOServer.getAllClients().forEach(client -> {
                var webSocketSession =
                        webSocketSessions.get(client.getSessionId().toString());
                if (Objects.nonNull(webSocketSession)) {
                    try {
                        String currentUserId = webSocketSession.getUserId();
                        ChatMessageResponse response =
                                toChatMessageResponseForRecall(recalledMessage, currentUserId, recallerUserId);

                        String message = objectMapper.writeValueAsString(response);
                        client.sendEvent("message-recalled", message);

                        log.debug("Sent recall update to client: {} (user: {})", client.getSessionId(), currentUserId);
                    } catch (Exception e) {
                        log.error("Error sending recall update to client: {}", client.getSessionId(), e);
                    }
                }
            });

            log.info(
                    "Broadcasted recall update for message: {} to {} participants",
                    recalledMessage.getId(),
                    userIds.size());

        } catch (Exception e) {
            log.error("Error broadcasting recall update for message: {}", recalledMessage.getId(), e);
        }
    }

    private ChatMessageResponse toChatMessageResponseForRecall(
            ChatMessage message, String currentUserId, String recallerUserId) {
        ChatMessageResponse response = toChatMessageResponse(message, currentUserId);

        // Set the appropriate message content based on recall type and current user
        if (message.isRecalled()) {
            if ("self".equals(message.getRecallType())) {
                // For "self" recall type
                if (currentUserId.equals(recallerUserId)) {
                    // Show "Message has been recalled" to the person who recalled it
                    response.setMessage("Message has been recalled");
                } else {
                    // Show original message to others
                    response.setMessage(message.getOriginalMessage());
                    response.setRecalled(false); // Hide recall status from others
                }
            } else if ("everyone".equals(message.getRecallType())) {
                // For "everyone" recall type, show "Message has been recalled" to all users
                response.setMessage("Message has been recalled");
            }
        }

        return response;
    }

    public ChatMessageResponse pinMessage(String messageId, String userId) {
        // Find the message
        ChatMessage message = chatMessageRepository
                .findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify that the user is a participant in the conversation
        var conversation = conversationRepository
                .findById(message.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if message is already pinned
        if (message.isPinned()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Pin the message
        message.setPinned(true);
        message.setPinnedBy(userId);
        message.setPinnedDate(Instant.now());

        // Save the pinned message
        message = chatMessageRepository.save(message);

        // Get user info for system message
        var userResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userResponse.getResult();

        // Create system message for pin action
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(message.getConversationId())
                .message(userInfo.getFirstName() + " " + userInfo.getLastName() + " pinned a message")
                .type("SYSTEM")
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
        conversation.setLastMessage(systemMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Broadcast the pin to all participants
        broadcastPinMessage(message, conversation, userId, true);

        // Broadcast the system message
        broadcastMessage(systemMessage, conversation, userId, "SYSTEM");

        return toChatMessageResponse(message, userId);
    }

    public ChatMessageResponse unpinMessage(String messageId, String userId) {
        // Find the message
        ChatMessage message = chatMessageRepository
                .findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify that the user is a participant in the conversation
        var conversation = conversationRepository
                .findById(message.getConversationId())
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Check if message is not pinned
        if (!message.isPinned()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Unpin the message
        message.setPinned(false);
        message.setPinnedBy(null);
        message.setPinnedDate(null);

        // Save the unpinned message
        message = chatMessageRepository.save(message);

        // Get user info for system message
        var userResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userResponse.getResult();

        // Create system message for unpin action
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(message.getConversationId())
                .message(userInfo.getFirstName() + " " + userInfo.getLastName() + " unpinned a message")
                .type("SYSTEM")
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
        conversation.setLastMessage(systemMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Broadcast the unpin to all participants
        broadcastPinMessage(message, conversation, userId, false);

        // Broadcast the system message
        broadcastMessage(systemMessage, conversation, userId, "SYSTEM");

        return toChatMessageResponse(message, userId);
    }

    private void broadcastPinMessage(ChatMessage message, Conversation conversation, String userId, boolean isPinned) {
        try {
            // Get participants userIds
            List<String> userIds = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .toList();

            Map<String, WebSocketSession> webSocketSessions =
                    webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                            .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

            // Broadcast to all connected clients who are participants in this conversation
            socketIOServer.getAllClients().forEach(client -> {
                var webSocketSession =
                        webSocketSessions.get(client.getSessionId().toString());
                if (Objects.nonNull(webSocketSession)) {
                    try {
                        String currentUserId = webSocketSession.getUserId();
                        ChatMessageResponse response = toChatMessageResponse(message, currentUserId);

                        String messageJson = objectMapper.writeValueAsString(response);
                        String eventName = isPinned ? "message-pinned" : "message-unpinned";
                        client.sendEvent(eventName, messageJson);

                        log.debug(
                                "Sent {} update to client: {} (user: {})",
                                eventName,
                                client.getSessionId(),
                                currentUserId);
                    } catch (Exception e) {
                        log.error("Error sending pin update to client: {}", client.getSessionId(), e);
                    }
                }
            });

            log.info(
                    "Broadcasted {} update for message: {} to {} participants",
                    isPinned ? "pin" : "unpin",
                    message.getId(),
                    userIds.size());

        } catch (Exception e) {
            log.error("Error broadcasting pin update for message: {}", message.getId(), e);
        }
    }

    public void broadcastSystemMessage(ChatMessage systemMessage) {
        try {
            var conversation = conversationRepository
                    .findById(systemMessage.getConversationId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Handle null sender for system messages
            String senderId = (systemMessage.getSender() != null)
                    ? systemMessage.getSender().getUserId()
                    : "SYSTEM";

            broadcastMessage(systemMessage, conversation, senderId, "SYSTEM");
        } catch (Exception e) {
            log.error("Error broadcasting system message: {}", systemMessage.getId(), e);
        }
    }

    public ChatMessageResponse createSocketMediaMessage(SocketMediaMessageRequest request, String userId) {
        try {
            log.info(
                    "📁 Creating socket media message for user: {} in conversation: {} with fileUrl: {}",
                    userId,
                    request.getConversationId(),
                    request.getFileUrl());

            // Get conversation
            var conversation = conversationRepository
                    .findById(request.getConversationId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Get user info
            var userResponse = profileClient.getProfile(userId);
            var userInfo = userResponse.getResult();

            // Determine message type based on file type
            String messageType = determineMessageTypeFromUrl(request.getFileType());

            // Create chat message with media
            ChatMessage chatMessage = ChatMessage.builder()
                    .conversationId(request.getConversationId())
                    .message(request.getCaption() != null ? request.getCaption() : "") // Use caption as message
                    .type(messageType)
                    .status("SENT")
                    .createdDate(Instant.now())
                    .sender(ParticipantInfo.builder()
                            .userId(userInfo.getUserId())
                            .username(userInfo.getUsername())
                            .firstName(userInfo.getFirstName())
                            .lastName(userInfo.getLastName())
                            .avatar(userInfo.getAvatar())
                            .build())
                    // Media fields
                    .mediaUrl(request.getFileUrl())
                    .mediaType(request.getFileType())
                    .fileName(request.getFileName())
                    .fileSize(request.getFileSize())
                    .build();

            // Save message
            chatMessage = chatMessageRepository.save(chatMessage);
            log.info("📁 Socket media message saved with ID: {}", chatMessage.getId());

            log.info("File type: {}", request.getFileType());
            // Create system message for file upload notification
            String systemMessageText;
            if (request.getFileType() != null
                    && (request.getFileType().equals("image/png")
                            || request.getFileType().equals("image/jpeg")
                            || request.getFileType().equals("image/jpg")
                            || request.getFileType().equals("image/gif")
                            || request.getFileType().equals("image/webp"))) {
                systemMessageText = userInfo.getFirstName() + " " + userInfo.getLastName() + " uploaded an image";
            } else {
                systemMessageText = userInfo.getFirstName() + " " + userInfo.getLastName() + " sent a file";
            }

            ChatMessage systemMessage = ChatMessage.builder()
                    .conversationId(request.getConversationId())
                    .message(systemMessageText)
                    .type("SYSTEM_FILE")
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
            log.info("📁 System file message created with ID: {}", systemMessage.getId());

            // Update conversation lastMessage with system message
            conversation.setLastMessage(systemMessage);
            conversation.setModifiedDate(Instant.now());
            conversationRepository.save(conversation);

            // Broadcast media message via socket
            broadcastMessage(chatMessage, conversation, userId, "MEDIA");
            log.info("📁 Socket media message broadcasted successfully");

            // Broadcast system message via socket
            broadcastMessage(systemMessage, conversation, userId, "SYSTEM_FILE");
            log.info("📁 System file message broadcasted successfully");

            // Return response
            return toChatMessageResponse(chatMessage, userId);

        } catch (Exception e) {
            log.error("📁 Error creating socket media message for user: {}", userId, e);
            throw new AppException(ErrorCode.MESSAGE_CREATION_FAILED);
        }
    }

    /**
     * Create a media reply message via socket
     */
    public ChatMessageResponse createSocketMediaReply(SocketMediaMessageRequest request, String userId) {
        try {
            log.info(
                    "📁 Creating socket media reply for user: {} in conversation: {} with fileUrl: {}",
                    userId,
                    request.getConversationId(),
                    request.getFileUrl());

            // Validate reply message exists
            var replyToMessage = chatMessageRepository
                    .findById(request.getReplyToMessageId())
                    .orElseThrow(() -> new AppException(ErrorCode.INVALID_REPLY_MESSAGE));

            // Get conversation
            var conversation = conversationRepository
                    .findById(request.getConversationId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Get user info
            var userResponse = profileClient.getProfile(userId);
            var userInfo = userResponse.getResult();

            // Determine message type based on file type
            String messageType = determineMessageTypeFromUrl(request.getFileType()) + "_REPLY";

            // Create chat message with media reply
            ChatMessage chatMessage = ChatMessage.builder()
                    .conversationId(request.getConversationId())
                    .message(request.getCaption() != null ? request.getCaption() : "") // Use caption as message
                    .type(messageType)
                    .status("SENT")
                    .createdDate(Instant.now())
                    .replyToMessageId(request.getReplyToMessageId())
                    .sender(ParticipantInfo.builder()
                            .userId(userInfo.getUserId())
                            .username(userInfo.getUsername())
                            .firstName(userInfo.getFirstName())
                            .lastName(userInfo.getLastName())
                            .avatar(userInfo.getAvatar())
                            .build())
                    // Media fields
                    .mediaUrl(request.getFileUrl())
                    .mediaType(request.getFileType())
                    .fileName(request.getFileName())
                    .fileSize(request.getFileSize())
                    .build();

            // Save message
            chatMessage = chatMessageRepository.save(chatMessage);
            log.info("📁 Socket media reply saved with ID: {}", chatMessage.getId());

            // Create system message for file reply notification
            String systemMessageText = userInfo.getFirstName() + " " + userInfo.getLastName() + " sent a file";
            ChatMessage systemMessage = ChatMessage.builder()
                    .conversationId(request.getConversationId())
                    .message(systemMessageText)
                    .type("SYSTEM_FILE")
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
            log.info("📁 System file reply message created with ID: {}", systemMessage.getId());

            // Update conversation lastMessage with system message
            conversation.setLastMessage(systemMessage);
            conversation.setModifiedDate(Instant.now());
            conversationRepository.save(conversation);

            // Broadcast media reply message via socket
            broadcastMessage(chatMessage, conversation, userId, "REPLY");
            log.info("📁 Socket media reply broadcasted successfully");

            // Broadcast system message via socket
            broadcastMessage(systemMessage, conversation, userId, "SYSTEM_FILE");
            log.info("📁 System file reply message broadcasted successfully");

            // Return response
            return toChatMessageResponse(chatMessage, userId);

        } catch (Exception e) {
            log.error("📁 Error creating socket media reply for user: {}", userId, e);
            throw new AppException(ErrorCode.MESSAGE_CREATION_FAILED);
        }
    }

    /**
     * Delete media message via socket
     */
    public void deleteSocketMediaMessage(String messageId, String userId) {
        try {
            log.info("📁 Deleting socket media message: {} by user: {}", messageId, userId);

            var message = chatMessageRepository
                    .findById(messageId)
                    .orElseThrow(() -> new AppException(ErrorCode.MESSAGE_NOT_FOUND));

            // Check if user is the sender
            if (message.getSender() == null || !message.getSender().getUserId().equals(userId)) {
                throw new AppException(ErrorCode.ACCESS_DENIED);
            }

            // Check if message has media
            if (message.getMediaUrl() == null) {
                throw new AppException(ErrorCode.NOT_MEDIA_MESSAGE);
            }

            // Get conversation for broadcasting
            var conversation = conversationRepository
                    .findById(message.getConversationId())
                    .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

            // Delete the message
            chatMessageRepository.delete(message);
            log.info("📁 Socket media message deleted from database: {}", messageId);

            // Update conversation if this was the last message
            if (conversation.getLastMessage() != null
                    && conversation.getLastMessage().getId().equals(messageId)) {

                // Find the previous message to set as last message
                var messages = chatMessageRepository.findAllByConversationIdOrderByCreatedDateDesc(
                        (message.getConversationId()));

                if (messages.size() > 1) {
                    conversation.setLastMessage(messages.get(1));
                } else {
                    conversation.setLastMessage(null);
                }
                conversation.setModifiedDate(Instant.now());
                conversationRepository.save(conversation);
            }

            // Broadcast deletion to all participants
            broadcastMediaDeletion(messageId, conversation, userId);
            log.info("📁 Socket media message deletion broadcasted: {}", messageId);

        } catch (Exception e) {
            log.error("📁 Error deleting socket media message: {}", messageId, e);
            throw new RuntimeException("Failed to delete media message: " + e.getMessage());
        }
    }

    /**
     * Determine message type from file MIME type
     */
    private String determineMessageTypeFromUrl(String fileType) {
        if (fileType == null) return "FILE";

        if (fileType.startsWith("image/")) {
            return "IMAGE";
        } else if (fileType.startsWith("video/")) {
            return "VIDEO";
        } else if (fileType.startsWith("audio/")) {
            return "AUDIO";
        } else if (fileType.contains("pdf")
                || fileType.contains("document")
                || fileType.contains("text")
                || fileType.contains("application/")) {
            return "DOCUMENT";
        } else {
            return "FILE";
        }
    }

    /**
     * Broadcast media message deletion to all participants
     */
    private void broadcastMediaDeletion(String messageId, Conversation conversation, String deletedBy) {
        try {
            // Get participants userIds
            List<String> userIds = conversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .toList();

            Map<String, WebSocketSession> webSocketSessions =
                    webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                            .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

            // Create deletion notification
            Map<String, Object> deletionData = Map.of(
                    "messageId",
                    messageId,
                    "conversationId",
                    conversation.getId(),
                    "deletedBy",
                    deletedBy,
                    "timestamp",
                    Instant.now().toString());

            socketIOServer.getAllClients().forEach(client -> {
                var webSocketSession =
                        webSocketSessions.get(client.getSessionId().toString());

                if (Objects.nonNull(webSocketSession)) {
                    try {
                        String message = objectMapper.writeValueAsString(deletionData);
                        client.sendEvent("message-deleted", message);
                    } catch (JsonProcessingException e) {
                        log.error("Error serializing media deletion response", e);
                    }
                }
            });

            log.info("📁 Media deletion broadcasted to {} participants", userIds.size());

        } catch (Exception e) {
            log.error("📁 Error broadcasting media deletion for message: {}", messageId, e);
        }
    }

    /**
     * Create group conversation via socket and broadcast to all participants
     */
    public void createSocketGroupConversation(
            String groupName, String groupAvatar, List<String> participantIds, String creatorId) {
        try {
            log.info(
                    "🔥 Creating socket group conversation '{}' with creator: {} and participants: {}",
                    groupName,
                    creatorId,
                    participantIds);

            // Validate group name
            if (groupName == null || groupName.trim().isEmpty()) {
                throw new AppException(ErrorCode.INVALID_GROUP_NAME);
            }

            // Validate participant list (must have at least 1 other participant besides creator)
            if (participantIds == null || participantIds.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_PARTICIPANTS);
            }

            // Add creator to participants list and remove duplicates
            List<String> allParticipantIds = new ArrayList<>();
            allParticipantIds.add(creatorId);
            allParticipantIds.addAll(participantIds.stream()
                    .filter(id -> !id.equals(creatorId))
                    .distinct()
                    .collect(Collectors.toList()));

            log.info("🔥 Final participant list for socket group: {}", allParticipantIds);

            // Fetch all participant profiles
            List<ParticipantInfo> participants = new ArrayList<>();

            for (String participantId : allParticipantIds) {
                var profileResponse = profileClient.getProfile(participantId);
                if (profileResponse == null || profileResponse.getResult() == null) {
                    log.error("🔥 Failed to fetch profile for user: {}", participantId);
                    throw new AppException(ErrorCode.USER_NOT_EXISTED);
                }

                var userInfo = profileResponse.getResult();
                participants.add(ParticipantInfo.builder()
                        .userId(userInfo.getUserId())
                        .username(userInfo.getUsername())
                        .firstName(userInfo.getFirstName())
                        .lastName(userInfo.getLastName())
                        .avatar(userInfo.getAvatar())
                        .build());
            }

            // Generate unique hash for group conversation (sorted participant IDs)
            var sortedIds = allParticipantIds.stream().sorted().collect(Collectors.toList());
            String participantsHash = generateParticipantHash(sortedIds);

            // Get creator profile for reader info
            var creatorProfileResponse = profileClient.getProfile(creatorId);
            var creatorInfo = creatorProfileResponse.getResult();
            ParticipantInfo creatorReaderInfo = ParticipantInfo.builder()
                    .userId(creatorInfo.getUserId())
                    .username(creatorInfo.getUsername())
                    .firstName(creatorInfo.getFirstName())
                    .lastName(creatorInfo.getLastName())
                    .avatar(creatorInfo.getAvatar())
                    .build();

            // Create welcome message - mark creator as already read, others as unread
            ChatMessage welcomeMessage = ChatMessage.builder()
                    .message("Welcome to " + groupName)
                    .type("SYSTEM")
                    .status("SENT") // Keep as SENT for non-creators to see as unread
                    .sender(null) // System message has no sender
                    .createdDate(Instant.now())
                    .reader(creatorReaderInfo) // Creator is first reader
                    .readers(new ArrayList<>(List.of(creatorReaderInfo))) // Creator already read it
                    .build();

            // Create group conversation
            Conversation groupConversation = Conversation.builder()
                    .type("GROUP")
                    .participantsHash(participantsHash)
                    .participants(participants)
                    .groupName(groupName)
                    .createdBy(creatorId)
                    .groupAvatar(groupAvatar)
                    .lastMessage(welcomeMessage)
                    .createdDate(Instant.now())
                    .modifiedDate(Instant.now())
                    .build();

            // Save conversation first to get ID
            groupConversation = conversationRepository.save(groupConversation);

            // Update welcome message with conversation ID and save it
            welcomeMessage.setConversationId(groupConversation.getId());
            chatMessageRepository.save(welcomeMessage);

            // Update conversation with saved welcome message
            groupConversation.setLastMessage(welcomeMessage);
            groupConversation = conversationRepository.save(groupConversation);

            log.info(
                    "🔥 Socket group conversation created successfully: {} with {} participants",
                    groupConversation.getId(),
                    participants.size());

            // Broadcast the new group conversation to all participants via socket
            broadcastNewGroupConversation(groupConversation);

            // Broadcast the welcome message to all participants
//            broadcastMessage(welcomeMessage, groupConversation, creatorId, "SYSTEM");

        } catch (Exception e) {
            log.error("🔥 Error creating socket group conversation", e);
            throw new RuntimeException("Failed to create group conversation: " + e.getMessage());
        }
    }

    /**
     * Generate participant hash for conversation uniqueness
     */
    private String generateParticipantHash(List<String> ids) {
        return String.join("_", ids);
    }

    /**
     * Broadcast new group conversation to all participants
     */
    private void broadcastNewGroupConversation(Conversation groupConversation) {
        try {
            // Get participants userIds
            List<String> userIds = groupConversation.getParticipants().stream()
                    .map(ParticipantInfo::getUserId)
                    .toList();

            Map<String, WebSocketSession> webSocketSessions =
                    webSocketSessionRepository.findAllByUserIdIn(userIds).stream()
                            .collect(Collectors.toMap(WebSocketSession::getSocketSessionId, Function.identity()));

            log.info("🔥 Broadcasting new group conversation to {} participants", userIds.size());

            // Create conversation response for each participant
            socketIOServer.getAllClients().forEach(client -> {
                var webSocketSession =
                        webSocketSessions.get(client.getSessionId().toString());

                if (Objects.nonNull(webSocketSession)) {
                    try {
                        String currentUserId = webSocketSession.getUserId();

                        // Create conversation response with proper group handling
                        var conversationResponse = createConversationResponseForUser(groupConversation, currentUserId);

                        String message = objectMapper.writeValueAsString(conversationResponse);
                        client.sendEvent("new-group-conversation", message);

                        log.info(
                                "🔥 Sent new group conversation to client: {} (user: {})",
                                client.getSessionId(),
                                currentUserId);
                    } catch (JsonProcessingException e) {
                        log.error(
                                "🔥 Error serializing group conversation response for client: {}",
                                client.getSessionId(),
                                e);
                    }
                }
            });

            log.info(
                    "🔥 Successfully broadcasted new group conversation: {} to {} participants",
                    groupConversation.getId(),
                    userIds.size());

        } catch (Exception e) {
            log.error("🔥 Error broadcasting new group conversation: {}", groupConversation.getId(), e);
        }
    }

    /**
     * Create conversation response for a specific user
     */
    private ConversationResponse createConversationResponseForUser(Conversation conversation, String userId) {
        long unreadCount = 0;

        if ("GROUP".equals(conversation.getType())) {
            // For group conversations, find the most recent time this user was added
            List<ChatMessage> allMessages = chatMessageRepository.findByConversationId(conversation.getId());

            // Find the most recent SYSTEM_ADD_MEMBERS message where this user was added
            Instant userLastAddedTime = null;
            for (int i = allMessages.size() - 1; i >= 0; i--) {
                ChatMessage message = allMessages.get(i);
                if ("SYSTEM_ADD_MEMBERS".equals(message.getType()) &&
                    message.getMessage().startsWith("SYSTEM_ADD_MEMBERS:")) {
                    try {
                        // Extract metadata to check if this user was added
                        String metadataJson = message.getMessage().substring("SYSTEM_ADD_MEMBERS:".length());
                        Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);
                        List<String> addedMemberIds = (List<String>) metadata.get("addedMemberIds");

                        if (addedMemberIds != null && addedMemberIds.contains(userId)) {
                            userLastAddedTime = message.getCreatedDate();
                            log.info("🔍 [ChatMessageService] User {} was last added to group at: {}", userId, userLastAddedTime);
                            break;
                        }
                    } catch (Exception e) {
                        log.warn("🔍 [ChatMessageService] Error parsing add members metadata: {}", e.getMessage());
                    }
                }
            }

            // Count unread messages only from after the user's last addition (or all if never added via system message)
            for (ChatMessage message : allMessages) {
                // Skip messages that were created before the user's last addition to the group
                if (userLastAddedTime != null && message.getCreatedDate().isBefore(userLastAddedTime)) {
                    continue;
                }

                // Skip basic system messages that shouldn't count toward unread
                if ("SYSTEM".equals(message.getType()) &&
                    (message.getMessage().contains("Let's start chat") ||
                     message.getMessage().contains("start chat conversation"))) {
                    continue;
                }

                // Skip messages sent by the current user (they auto-read their own messages)
                if (message.getSender() != null && userId.equals(message.getSender().getUserId())) {
                    continue;
                }

                // Check if user has read this message
                boolean userHasRead = false;

                if (message.getReaders() != null) {
                    userHasRead = message.getReaders().stream()
                            .anyMatch(reader -> reader.getUserId().equals(userId));
                }

                // If user hasn't read it, count it as unread
                if (!userHasRead) {
                    unreadCount++;
                    log.info("🔍 [ChatMessageService] Unread message found (after last addition): id={}, type={}, createdDate={}, message='{}'",
                            message.getId(), message.getType(), message.getCreatedDate(),
                            message.getMessage().substring(0, Math.min(30, message.getMessage().length())));
                }
            }
        } else {
            // For direct conversations, use the original logic
            List<String> systemTypes = List.of("SYSTEM", "SYSTEM_ADD_MEMBERS", "SYSTEM_REMOVE_MEMBERS", "SYSTEM_CREATE_GROUP");
            unreadCount = chatMessageRepository.countByConversationIdAndSenderUserIdNotAndStatusNotAndTypeNotIn(
                    conversation.getId(), userId, "SEEN", systemTypes);
        }

        log.info("🔍 [ChatMessageService] Total unread count for user {}: {}", userId, unreadCount);

        // Create and return proper ConversationResponse object
        return ConversationResponse.builder()
                .id(conversation.getId())
                .type(conversation.getType())
                .participantsHash(conversation.getParticipantsHash())
                .conversationAvatar(conversation.getGroupAvatar())
                .conversationName(conversation.getGroupName())
                .participants(conversation.getParticipants())
                .lastMessage(conversation.getLastMessage())
                .unreadCount((int) unreadCount)
                .groupName(conversation.getGroupName())
                .createdBy(conversation.getCreatedBy())
                .groupAvatar(conversation.getGroupAvatar())
                .createdDate(conversation.getCreatedDate())
                .modifiedDate(conversation.getModifiedDate())
                .build();
    }

    public ChatMessageResponse createSystemMessage(String conversationId, String message, String messageType, String userId) {
        // Find the conversation
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Create system message
        ChatMessage systemMessage = ChatMessage.builder()
                .conversationId(conversationId)
                .message(message)
                .type(messageType)
                .sender(null) // System messages have no sender
                .status("SENT")
                .createdDate(Instant.now())
                .build();

        // Save the system message
        systemMessage = chatMessageRepository.save(systemMessage);

        // Update conversation's last message
        conversation.setLastMessage(systemMessage);
        conversation.setModifiedDate(Instant.now());
        conversationRepository.save(conversation);

        // Broadcast the system message to all participants
        ChatMessageResponse messageResponse = toChatMessageResponse(systemMessage, userId);
        broadcastMessage(systemMessage, conversation, userId, "SYSTEM");

        return messageResponse;
    }

    public void broadcastGroupInfoUpdate(String conversationId, ConversationResponse updatedConversation) {
        // Get all WebSocket sessions for participants in this conversation
        List<WebSocketSession> participantSessions = webSocketSessionRepository.findAllByCurrentConversationId(conversationId);

        log.info("Broadcasting group info update to {} participants in conversation: {}",
                participantSessions.size(), conversationId);

        // Broadcast to all participants currently in the conversation
        for (WebSocketSession session : participantSessions) {
            try {
                socketIOServer.getClient(java.util.UUID.fromString(session.getSocketSessionId()))
                        .sendEvent("group-info-updated", updatedConversation);
                log.info("Sent group info update to user: {} (session: {})",
                        session.getUserId(), session.getSocketSessionId());
            } catch (Exception e) {
                log.error("Failed to send group info update to session: {}", session.getSocketSessionId(), e);
            }
        }

        // Also broadcast to all participants regardless of their current conversation
        // This ensures all group members get the update even if they're not currently viewing the chat
        List<String> participantIds = updatedConversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .toList();

        List<WebSocketSession> allParticipantSessions = webSocketSessionRepository.findAllByUserIdIn(participantIds);

        for (WebSocketSession session : allParticipantSessions) {
            if (participantSessions.stream().noneMatch(s -> s.getSocketSessionId().equals(session.getSocketSessionId()))) {
                try {
                    socketIOServer.getClient(java.util.UUID.fromString(session.getSocketSessionId()))
                            .sendEvent("conversation-updated", updatedConversation);
                    log.info("Sent conversation update to user: {} (session: {})",
                            session.getUserId(), session.getSocketSessionId());
                } catch (Exception e) {
                    log.error("Failed to send conversation update to session: {}", session.getSocketSessionId(), e);
                }
            }
        }
    }
    public ChatMessageResponse forwardMessage(ForwardMessageRequest request) {
    // Find the original message
    var originalMessage = chatMessageRepository.findById(request.getMessageId())
        .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

    // Get user info for sender
    var userResponse = profileClient.getProfile(request.getFromUserId());
    if (userResponse == null || userResponse.getResult() == null) {
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }
    var userInfo = userResponse.getResult();

    // Build new ChatMessage for the target conversation
    ChatMessage chatMessage = ChatMessage.builder()
        .conversationId(request.getToConversationId())
        .message(originalMessage.getMessage())
        .type(originalMessage.getType())
        .status("SENT")
        .createdDate(Instant.now())
        .sender(com.devteria.chat.entity.ParticipantInfo.builder()
            .userId(userInfo.getUserId())
            .username(userInfo.getUsername())
            .firstName(userInfo.getFirstName())
            .lastName(userInfo.getLastName())
            .avatar(userInfo.getAvatar())
            .build())
        .build();

    chatMessage = chatMessageRepository.save(chatMessage);

    // Update conversation lastMessage and typeMessage
    var conversation = conversationRepository.findById(request.getToConversationId())
        .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
    conversation.setLastMessage(chatMessage);
    conversation.setModifiedDate(Instant.now());
    conversationRepository.save(conversation);

    // Broadcast to WebSocket clients
    broadcastMessage(chatMessage, conversation, userInfo.getUserId(), originalMessage.getType());

    return toChatMessageResponse(chatMessage, userInfo.getUserId());
    }
        /**
     * Edit an existing chat message's content and broadcast the update.
     */
    public ChatMessageResponse editMessage(String messageId, String newContent, String userId, String conversationId) {
        // Find the message
        ChatMessage chatMessage = chatMessageRepository.findById(messageId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Only the sender can edit their message
        if (!chatMessage.getSender().getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Update message content and set edited flag
        chatMessage.setMessage(newContent);
        chatMessage.setType("EDITED"); // Optionally, set a type or add an 'edited' flag
        chatMessage.setModifiedDate(Instant.now());

        chatMessage = chatMessageRepository.save(chatMessage);

        // Optionally update conversation lastMessage if this is the latest message
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));
        if (conversation.getLastMessage() != null && conversation.getLastMessage().getId().equals(messageId)) {
            conversation.setLastMessage(chatMessage);
            conversation.setModifiedDate(Instant.now());
            conversationRepository.save(conversation);
        }

        // Broadcast the edited message to all clients in the conversation
        broadcastMessage(chatMessage, conversation, userId, "EDITED");

        return toChatMessageResponse(chatMessage, userId);
    }
}
