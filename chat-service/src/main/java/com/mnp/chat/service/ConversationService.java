package com.mnp.chat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.StringJoiner;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.chat.dto.request.AddParticipantsRequest;
import com.mnp.chat.dto.request.ConversationRequest;
import com.mnp.chat.dto.request.CreateProjectGroupRequest;
import com.mnp.chat.dto.request.EditGroupInfoRequest;
import com.mnp.chat.dto.request.RemoveParticipantsRequest;
import com.mnp.chat.dto.response.ChatMessageResponse;
import com.mnp.chat.dto.response.ConversationResponse;
import com.mnp.chat.entity.ChatMessage;
import com.mnp.chat.entity.Conversation;
import com.mnp.chat.entity.ParticipantInfo;
import com.mnp.chat.exception.AppException;
import com.mnp.chat.exception.ErrorCode;
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
public class ConversationService {
    ConversationRepository conversationRepository;
    ChatMessageRepository chatMessageRepository;
    ChatMessageService chatMessageService;
    ProfileClient profileClient;
    ChatNotificationService chatNotificationService;

    ObjectMapper objectMapper; // Add ObjectMapper for JSON parsing

    public List<ConversationResponse> myConversations() {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<Conversation> conversations = conversationRepository.findAllByParticipantIdsContains(userId);

        return conversations.stream()
                .map(conversation -> toConversationResponse(conversation, userId))
                .toList();
    }

    public ConversationResponse create(ConversationRequest request) {
        // Fetch user infos
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        var userInfoResponse = profileClient.getProfile(userId);
        var participantInfoResponse =
                profileClient.getProfile(request.getParticipantIds().getFirst());

        if (Objects.isNull(userInfoResponse) || Objects.isNull(participantInfoResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        var userInfo = userInfoResponse.getResult();
        var participantInfo = participantInfoResponse.getResult();

        List<String> userIds = new ArrayList<>();
        userIds.add(userId);
        userIds.add(participantInfo.getUserId());

        var sortedIds = userIds.stream().sorted().toList();
        String userIdHash = generateParticipantHash(sortedIds);

        var conversation = conversationRepository
                .findByParticipantsHash(userIdHash)
                .orElseGet(() -> {
                    List<ParticipantInfo> participantInfos = List.of(
                            ParticipantInfo.builder()
                                    .userId(userInfo.getUserId())
                                    .username(userInfo.getUser().getUsername())
                                    .firstName(userInfo.getUser().getFirstName())
                                    .lastName(userInfo.getUser().getLastName())
                                    .avatar(userInfo.getAvatar())
                                    .departmentName(userInfo.getUser().getDepartmentName())
                                    .positionTitle(userInfo.getUser().getPositionTitle())
                                    .seniorityLevel(userInfo.getUser().getSeniorityLevel())
                                    .roleName(userInfo.getUser().getRoleName())
                                    .build(),
                            ParticipantInfo.builder()
                                    .userId(participantInfo.getUserId())
                                    .username(participantInfo.getUser().getUsername())
                                    .firstName(participantInfo.getUser().getFirstName())
                                    .lastName(participantInfo.getUser().getLastName())
                                    .avatar(participantInfo.getAvatar())
                                    .departmentName(participantInfo.getUser().getDepartmentName())
                                    .positionTitle(participantInfo.getUser().getPositionTitle())
                                    .seniorityLevel(participantInfo.getUser().getSeniorityLevel())
                                    .roleName(participantInfo.getUser().getRoleName())
                                    .build());

                    // Build conversation info
                    Conversation newConversation = Conversation.builder()
                            .type(request.getType())
                            .participantsHash(userIdHash)
                            .lastMessage(ChatMessage.builder()
                                    .message("Let's start chat conversation")
                                    .type("SYSTEM")
                                    .sender(null)
                                    .createdDate(Instant.now())
                                    .build())
                            .createdDate(Instant.now())
                            .modifiedDate(Instant.now())
                            .participants(participantInfos)
                            .build();

                    return conversationRepository.save(newConversation);
                });

        return toConversationResponse(conversation, userId);
    }

    private String generateParticipantHash(List<String> ids) {
        StringJoiner stringJoiner = new StringJoiner("_");
        ids.forEach(stringJoiner::add);

        return stringJoiner.toString();
    }

    // Fix the unread count calculation to properly handle group conversations by checking the readers field instead of
    // just the status field, and exclude basic system messages that shouldn't count toward unread count
    private ConversationResponse toConversationResponse(Conversation conversation, String currentUserId) {
        log.info("🔍 Calculating unread count for user {} in conversation {}", currentUserId, conversation.getId());

        long unreadCount = 0;

        if ("GROUP".equals(conversation.getType())) {
            // For group conversations, find the most recent time this user was added
            List<ChatMessage> allMessages = chatMessageRepository.findByConversationId(conversation.getId());

            // Find the most recent SYSTEM_ADD_MEMBERS message where this user was added
            Instant userLastAddedTime = null;
            for (int i = allMessages.size() - 1; i >= 0; i--) {
                ChatMessage message = allMessages.get(i);
                if ("SYSTEM_ADD_MEMBERS".equals(message.getType())
                        && message.getMessage().startsWith("SYSTEM_ADD_MEMBERS:")) {
                    try {
                        // Extract metadata to check if this user was added
                        String metadataJson = message.getMessage().substring("SYSTEM_ADD_MEMBERS:".length());
                        Map<String, Object> metadata = objectMapper.readValue(metadataJson, Map.class);
                        List<String> addedMemberIds = (List<String>) metadata.get("addedMemberIds");

                        if (addedMemberIds != null && addedMemberIds.contains(currentUserId)) {
                            userLastAddedTime = message.getCreatedDate();
                            log.info("🔍 User {} was last added to group at: {}", currentUserId, userLastAddedTime);
                            break;
                        }
                    } catch (Exception e) {
                        log.warn("🔍 Error parsing add members metadata: {}", e.getMessage());
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
                if ("SYSTEM".equals(message.getType())
                        && (message.getMessage().contains("Let's start chat")
                                || message.getMessage().contains("start chat conversation"))) {
                    continue;
                }

                // Skip messages sent by the current user (they auto-read their own messages)
                if (message.getSender() != null
                        && currentUserId.equals(message.getSender().getUserId())) {
                    continue;
                }

                // Check if user has read this message
                boolean userHasRead = false;

                if (message.getReaders() != null) {
                    userHasRead = message.getReaders().stream()
                            .anyMatch(reader -> reader.getUserId().equals(currentUserId));
                }

                // If user hasn't read it, count it as unread
                if (!userHasRead) {
                    unreadCount++;
                    log.info(
                            "🔍 Unread message found (after last addition): id={}, type={}, createdDate={}, message='{}'",
                            message.getId(),
                            message.getType(),
                            message.getCreatedDate(),
                            message.getMessage()
                                    .substring(
                                            0, Math.min(30, message.getMessage().length())));
                }
            }
        } else {
            // For direct conversations, use the original logic
            List<String> excludedSystemTypes = Arrays.asList("SYSTEM");
            unreadCount = chatMessageRepository.countByConversationIdAndSenderUserIdNotAndStatusNotAndTypeNotIn(
                    conversation.getId(), currentUserId, "SEEN", excludedSystemTypes);
        }

        log.info("🔍 Total unread count for user {}: {}", currentUserId, unreadCount);

        // Debug logging for lastMessage
        ChatMessage lastMessage = conversation.getLastMessage();
        if (lastMessage != null) {
            log.info(
                    "Processing lastMessage for conversation {}: id={}, message='{}', isRecalled={}, recallType={}",
                    conversation.getId(),
                    lastMessage.getId(),
                    lastMessage.getMessage(),
                    lastMessage.isRecalled(),
                    lastMessage.getRecallType());
        }

        // Use the same recall logic as ChatMessageService by converting to ChatMessageResponse
        ChatMessageResponse lastMessageResponse = null;

        if (lastMessage != null) {
            // Convert to ChatMessageResponse using the same logic as ChatMessageService
            lastMessageResponse = toChatMessageResponseWithRecallLogic(lastMessage, currentUserId);
            log.info(
                    "Converted lastMessage response: id={}, message='{}', isRecalled={}, recallType={}",
                    lastMessageResponse.getId(),
                    lastMessageResponse.getMessage(),
                    lastMessageResponse.isRecalled(),
                    lastMessageResponse.getRecallType());
        }

        // Handle different conversation types
        if ("GROUP".equals(conversation.getType())) {
            // For group conversations, use group-specific details
            return ConversationResponse.builder()
                    .id(conversation.getId())
                    .type(conversation.getType())
                    .participantsHash(conversation.getParticipantsHash())
                    .conversationAvatar(conversation.getGroupAvatar()) // Use group avatar
                    .conversationName(conversation.getGroupName()) // Use group name
                    .participants(conversation.getParticipants())
                    .lastMessage(
                            lastMessageResponse != null ? convertResponseBackToChatMessage(lastMessageResponse) : null)
                    .unreadCount((int) unreadCount)
                    // Group-specific fields
                    .groupName(conversation.getGroupName())
                    .createdBy(conversation.getCreatedBy())
                    .groupAvatar(conversation.getGroupAvatar())
                    .createdDate(conversation.getCreatedDate())
                    .modifiedDate(conversation.getModifiedDate())
                    .build();
        } else {
            // For direct conversations, use the other participant's details
            ParticipantInfo userOtherId = conversation.getParticipants().stream()
                    .filter(participant -> !participant.getUserId().equals(currentUserId))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

            return ConversationResponse.builder()
                    .id(conversation.getId())
                    .type(conversation.getType())
                    .participantsHash(conversation.getParticipantsHash())
                    .conversationAvatar(userOtherId.getAvatar())
                    .conversationName(userOtherId.getFirstName() + " " + userOtherId.getLastName())
                    .participants(conversation.getParticipants())
                    .lastMessage(
                            lastMessageResponse != null ? convertResponseBackToChatMessage(lastMessageResponse) : null)
                    .unreadCount((int) unreadCount)
                    .createdDate(conversation.getCreatedDate())
                    .modifiedDate(conversation.getModifiedDate())
                    .build();
        }
    }

    private ChatMessageResponse toChatMessageResponseWithRecallLogic(ChatMessage chatMessage, String userId) {
        var chatMessageResponse = ChatMessageResponse.builder()
                .id(chatMessage.getId())
                .conversationId(chatMessage.getConversationId())
                .message(chatMessage.getMessage())
                .type(chatMessage.getType())
                .status(chatMessage.getStatus())
                .readDate(chatMessage.getReadDate())
                .reader(chatMessage.getReader())
                .sender(chatMessage.getSender())
                .replyToMessageId(chatMessage.getReplyToMessageId())
                .createdDate(chatMessage.getCreatedDate())
                .recalled(chatMessage.isRecalled())
                .recallType(chatMessage.getRecallType())
                .recalledBy(chatMessage.getRecalledBy())
                .recalledDate(chatMessage.getRecalledDate())
                .build();

        // Handle system messages with null sender
        if (chatMessage.getSender() != null) {
            chatMessageResponse.setMe(userId.equals(chatMessage.getSender().getUserId()));
        } else {
            chatMessageResponse.setMe(false); // System messages are never "me"
        }

        // Apply recall logic - same as ChatMessageService
        if (chatMessage.isRecalled()) {
            if ("self".equals(chatMessage.getRecallType())) {
                if (userId.equals(chatMessage.getRecalledBy())) {
                    chatMessageResponse.setMessage("Message has been recalled");
                } else {
                    chatMessageResponse.setMessage(chatMessage.getOriginalMessage());
                    chatMessageResponse.setRecalled(false);
                    chatMessageResponse.setRecallType(null);
                    chatMessageResponse.setRecalledBy(null);
                    chatMessageResponse.setRecalledDate(null);
                }
            } else if ("everyone".equals(chatMessage.getRecallType())) {
                chatMessageResponse.setMessage("Message has been recalled");
            }
        }

        return chatMessageResponse;
    }

    private ChatMessage convertResponseBackToChatMessage(ChatMessageResponse response) {
        return ChatMessage.builder()
                .id(response.getId())
                .conversationId(response.getConversationId())
                .message(response.getMessage())
                .type(response.getType())
                .status(response.getStatus())
                .readDate(response.getReadDate())
                .reader(response.getReader())
                .sender(response.getSender())
                .replyToMessageId(response.getReplyToMessageId())
                .createdDate(response.getCreatedDate())
                .isRecalled(response.isRecalled())
                .recallType(response.getRecallType())
                .recalledBy(response.getRecalledBy())
                .recalledDate(response.getRecalledDate())
                .build();
    }

    //    public ConversationResponse addMembersToGroup(String conversationId, AddParticipantsRequest
    // addParticipantsRequest) {
    //        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
    //        return addMembersToGroup(conversationId, addParticipantsRequest, userId);
    //    }

    public ConversationResponse addMembersToGroup(
            String conversationId, AddParticipantsRequest addParticipantsRequest, String userId) {
        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getType().equals("GROUP")) {
            throw new AppException(ErrorCode.INVALID_CONVERSATION_TYPE);
        }

        // Check if current user is a participant in the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        // Get existing participant IDs for validation
        List<String> existingParticipantIds = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .collect(Collectors.toList());

        // Filter out users who are already members
        List<String> newMemberIds = addParticipantsRequest.getParticipantIds().stream()
                .filter(participantId -> !existingParticipantIds.contains(participantId))
                .collect(Collectors.toList());

        if (newMemberIds.isEmpty()) {
            throw new AppException(
                    ErrorCode.UNCATEGORIZED_EXCEPTION); // Or create a specific error for "already members"
        }

        // Create ParticipantInfo objects for new members
        List<ParticipantInfo> newParticipants = newMemberIds.stream()
                .map(participantId -> {
                    var profileResponse = profileClient.getProfile(participantId);
                    if (profileResponse == null || profileResponse.getResult() == null) {
                        throw new AppException(ErrorCode.USER_NOT_EXISTED);
                    }
                    var userProfile = profileResponse.getResult();
                    var userInfo = userProfile.getUser(); // Access nested user data
                    return ParticipantInfo.builder()
                            .userId(userProfile.getUserId())
                            .username(userInfo.getUsername())
                            .firstName(userInfo.getFirstName())
                            .lastName(userInfo.getLastName())
                            .avatar(userProfile.getAvatar()) // Avatar at profile level
                            .departmentName(userInfo.getDepartmentName())
                            .positionTitle(userInfo.getPositionTitle())
                            .seniorityLevel(userInfo.getSeniorityLevel())
                            .roleName(userInfo.getRoleName())
                            .build();
                })
                .collect(Collectors.toList());

        // Add new participants to the conversation
        conversation.getParticipants().addAll(newParticipants);

        // Update participants hash
        String participantsHash = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .sorted()
                .collect(Collectors.joining(","));
        conversation.setParticipantsHash(participantsHash);

        conversation.setModifiedDate(Instant.now());

        // Save the updated conversation first
        Conversation updatedConversation = conversationRepository.save(conversation);

        log.info("Added {} new members to group conversation: {}", newParticipants.size(), updatedConversation.getId());

        // Let ChatMessageService handle BOTH database storage AND WebSocket broadcasting
        chatMessageService.broadcastAddMembersMessage(
                updatedConversation, userId, newParticipants, conversation.getGroupName());

        // Send notifications to newly added members
        String addedByName = getParticipantName(conversation.getParticipants(), userId);
        for (ParticipantInfo newParticipant : newParticipants) {
            chatNotificationService.notifyUserAddedToGroup(
                    conversation.getGroupName(), conversation.getId(), newParticipant, addedByName);
        }

        // Convert to ConversationResponse
        return toConversationResponse(updatedConversation, userId);
    }

    public ConversationResponse removeMembersFromGroup(
            String conversationId, RemoveParticipantsRequest removeParticipantsRequest, String userId) {
        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getType().equals("GROUP")) {
            throw new AppException(ErrorCode.INVALID_CONVERSATION_TYPE);
        }

        // Check if current user is a participant in the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        // Get existing participant IDs for validation
        List<String> existingParticipantIds = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .collect(Collectors.toList());

        // Filter to only include users who are actually members
        List<String> membersToRemoveIds = removeParticipantsRequest.getParticipantIds().stream()
                .filter(existingParticipantIds::contains)
                .collect(Collectors.toList());

        if (membersToRemoveIds.isEmpty()) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // Or create a specific error for "not members"
        }

        // Prevent removing the last member or the person who is doing the removal
        if (membersToRemoveIds.contains(userId)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION); // User cannot remove themselves
        }

        if (conversation.getParticipants().size() - membersToRemoveIds.size() <= 1) {
            throw new AppException(
                    ErrorCode.UNCATEGORIZED_EXCEPTION); // Cannot remove all members, must have at least 2
        }

        // Get participant info for members being removed (for message purposes)
        List<ParticipantInfo> membersToRemove = conversation.getParticipants().stream()
                .filter(participant -> membersToRemoveIds.contains(participant.getUserId()))
                .collect(Collectors.toList());

        // Remove participants from the conversation
        conversation.getParticipants().removeIf(participant -> membersToRemoveIds.contains(participant.getUserId()));

        // Update participants hash
        String participantsHash = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .sorted()
                .collect(Collectors.joining(","));
        conversation.setParticipantsHash(participantsHash);

        conversation.setModifiedDate(Instant.now());

        // Save the updated conversation first
        Conversation updatedConversation = conversationRepository.save(conversation);

        log.info("Removed {} members from group conversation: {}", membersToRemove.size(), updatedConversation.getId());

        // Let ChatMessageService handle BOTH database storage AND WebSocket broadcasting
        chatMessageService.broadcastRemoveMembersMessage(
                updatedConversation, userId, membersToRemove, conversation.getGroupName());

        // Convert to ConversationResponse
        return toConversationResponse(updatedConversation, userId);
    }

    public void leaveGroup(String conversationId, String userId) {
        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        if (!conversation.getType().equals("GROUP")) {
            throw new AppException(ErrorCode.INVALID_CONVERSATION_TYPE);
        }

        // Check if current user is a participant in the conversation
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.CONVERSATION_NOT_FOUND);
        }

        // Get the leaving user's participant info for message purposes
        ParticipantInfo leavingMember = conversation.getParticipants().stream()
                .filter(participant -> participant.getUserId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Check if this would leave only 1 person in the group
        if (conversation.getParticipants().size() <= 2) {
            // If only 2 people left, we could either:
            // 1. Delete the group entirely
            // 2. Convert to direct message
            // 3. Allow 1-person groups
            // For now, we'll allow the leave but could add business logic here
        }

        // Remove the user from participants BEFORE broadcasting (so remaining members get notified)
        conversation
                .getParticipants()
                .removeIf(participant -> participant.getUserId().equals(userId));

        // Update participants hash
        String participantsHash = conversation.getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .sorted()
                .collect(Collectors.joining(","));
        conversation.setParticipantsHash(participantsHash);

        conversation.setModifiedDate(Instant.now());

        // Save the updated conversation first
        Conversation updatedConversation = conversationRepository.save(conversation);

        log.info("User {} left group conversation: {}", userId, updatedConversation.getId());

        // Let ChatMessageService handle BOTH database storage AND WebSocket broadcasting
        // Pass the conversation AFTER user removal, but include the leaving member info
        chatMessageService.broadcastLeaveGroupMessage(
                updatedConversation, userId, leavingMember, conversation.getGroupName());
    }

    public ConversationResponse editGroupInfo(String conversationId, EditGroupInfoRequest request, String userId) {
        // Find the conversation
        Conversation conversation = conversationRepository
                .findById(conversationId)
                .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

        // Verify it's a group conversation
        if (!"GROUP".equals(conversation.getType())) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Verify user is a participant in the group
        boolean isParticipant = conversation.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isParticipant) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }

        // Get user info for system message
        var userInfoResponse = profileClient.getProfile(userId);
        if (Objects.isNull(userInfoResponse)) {
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
        var userInfo = userInfoResponse.getResult();
        String editorName =
                userInfo.getUser().getFirstName() + " " + userInfo.getUser().getLastName();

        // Track what changed
        boolean nameChanged = false;
        boolean avatarChanged = false;
        String oldGroupName = conversation.getGroupName();
        String oldGroupAvatar = conversation.getGroupAvatar();

        // Update group name if provided and different
        if (request.getGroupName() != null && !request.getGroupName().equals(conversation.getGroupName())) {
            conversation.setGroupName(request.getGroupName());
            nameChanged = true;
        }

        // Update group avatar if provided and different
        if (request.getGroupAvatar() != null && !request.getGroupAvatar().equals(conversation.getGroupAvatar())) {
            conversation.setGroupAvatar(request.getGroupAvatar());
            avatarChanged = true;
        }

        // Only proceed if something changed
        if (!nameChanged && !avatarChanged) {
            return toConversationResponse(conversation, userId);
        }

        // Update modified date
        conversation.setModifiedDate(Instant.now());

        // Save the updated conversation
        conversation = conversationRepository.save(conversation);

        // Create system messages for the changes
        if (nameChanged) {
            String systemMessage = editorName + " changed group name";
            if (oldGroupName != null) {
                systemMessage += " from \"" + oldGroupName + "\"";
            }
            systemMessage += " to \"" + conversation.getGroupName() + "\"";

            chatMessageService.createSystemMessage(conversationId, systemMessage, "SYSTEM_EDIT_GROUP_NAME", userId);
        }

        if (avatarChanged) {
            String systemMessage = editorName + " changed group avatar";
            chatMessageService.createSystemMessage(conversationId, systemMessage, "SYSTEM_EDIT_GROUP_AVATAR", userId);
        }

        return toConversationResponse(conversation, userId);
    }

    // Project-specific group creation methods
    public ConversationResponse createProjectGroup(CreateProjectGroupRequest request) {
        log.info("Creating project group for project: {}", request.getProjectId());

        // Collect all participant IDs (project manager, team lead, and initial members)
        List<String> allParticipantIds = new ArrayList<>();
        allParticipantIds.add(request.getProjectManagerId());
        if (request.getTeamLeadId() != null && !request.getTeamLeadId().equals(request.getProjectManagerId())) {
            allParticipantIds.add(request.getTeamLeadId());
        }
        if (request.getInitialMemberIds() != null) {
            request.getInitialMemberIds().stream()
                    .filter(id -> !allParticipantIds.contains(id))
                    .forEach(allParticipantIds::add);
        }

        // Fetch user information for all participants
        List<ParticipantInfo> participants = allParticipantIds.stream()
                .map(userId -> {
                    var profileResponse = profileClient.getProfile(userId);
                    if (profileResponse == null || profileResponse.getResult() == null) {
                        throw new AppException(ErrorCode.USER_NOT_EXISTED);
                    }
                    var userInfo = profileResponse.getResult();
                    return ParticipantInfo.builder()
                            .userId(userInfo.getUserId())
                            .username(userInfo.getUser().getUsername())
                            .firstName(userInfo.getUser().getFirstName())
                            .lastName(userInfo.getUser().getLastName())
                            .avatar(userInfo.getAvatar())
                            .departmentName(userInfo.getUser().getDepartmentName())
                            .positionTitle(userInfo.getUser().getPositionTitle())
                            .seniorityLevel(userInfo.getUser().getSeniorityLevel())
                            .roleName(userInfo.getUser().getRoleName())
                            .build();
                })
                .collect(Collectors.toList());

        // Generate unique hash for the project group
        String projectGroupHash = "PROJECT_" + request.getProjectId();

        // Check if project group already exists
        Optional<Conversation> existingGroup = conversationRepository.findByParticipantsHash(projectGroupHash);
        if (existingGroup.isPresent()) {
            log.info("Project group already exists for project: {}", request.getProjectId());
            return toConversationResponse(existingGroup.get(), request.getProjectManagerId());
        }

        // Create the project group conversation
        Conversation projectGroup = Conversation.builder()
                .type("GROUP")
                .participantsHash(projectGroupHash)
                .groupName(request.getProjectName() + " - Project Group")
                .createdBy(request.getProjectManagerId())
                .participants(participants)
                .lastMessage(ChatMessage.builder()
                        .message("Welcome to " + request.getProjectName() + " project group!")
                        .type("SYSTEM")
                        .sender(null)
                        .createdDate(Instant.now())
                        .build())
                .createdDate(Instant.now())
                .modifiedDate(Instant.now())
                .build();

        Conversation savedGroup = conversationRepository.save(projectGroup);

        // Send initial system message
        ChatMessage welcomeMessage = ChatMessage.builder()
                .conversationId(savedGroup.getId())
                .message("Welcome to " + request.getProjectName() + " project group! Project Manager: "
                        + getParticipantName(participants, request.getProjectManagerId())
                        + (request.getTeamLeadId() != null
                                ? ", Team Lead: " + getParticipantName(participants, request.getTeamLeadId())
                                : ""))
                .type("SYSTEM")
                .sender(null)
                .createdDate(Instant.now())
                .build();

        chatMessageRepository.save(welcomeMessage);

        log.info("Project group created successfully for project: {}", request.getProjectId());
        return toConversationResponse(savedGroup, request.getProjectManagerId());
    }

    public ConversationResponse addMemberToProjectGroup(String projectId, String userId) {
        log.info("Adding user {} to project group for project: {}", userId, projectId);

        String projectGroupHash = "PROJECT_" + projectId;
        Conversation projectGroup = conversationRepository
                .findByParticipantsHash(projectGroupHash)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Check if user is already a member
        boolean isAlreadyMember = projectGroup.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (isAlreadyMember) {
            log.info("User {} is already a member of project group: {}", userId, projectId);
            return toConversationResponse(projectGroup, userId);
        }

        // Get user information
        var profileResponse = profileClient.getProfile(userId);
        if (profileResponse == null || profileResponse.getResult() == null) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        var userInfo = profileResponse.getResult();
        ParticipantInfo newParticipant = ParticipantInfo.builder()
                .userId(userInfo.getUserId())
                .username(userInfo.getUser().getUsername())
                .firstName(userInfo.getUser().getFirstName())
                .lastName(userInfo.getUser().getLastName())
                .avatar(userInfo.getAvatar())
                .build();

        // Add the new participant
        projectGroup.getParticipants().add(newParticipant);
        projectGroup.setModifiedDate(Instant.now());

        Conversation updatedGroup = conversationRepository.save(projectGroup);

        // Send system message about the new member
        ChatMessage addMemberMessage = ChatMessage.builder()
                .conversationId(updatedGroup.getId())
                .message(userInfo.getUser().getFirstName() + " "
                        + userInfo.getUser().getLastName() + " has been added to the project group.")
                .type("SYSTEM_ADD_MEMBERS")
                .sender(null)
                .createdDate(Instant.now())
                .build();

        chatMessageRepository.save(addMemberMessage);

        // Send project-specific notification to the newly added user
        String projectManagerName = getParticipantName(projectGroup.getParticipants(), projectGroup.getCreatedBy());
        chatNotificationService.notifyUserAddedToProjectGroup(
                extractProjectNameFromGroupName(projectGroup.getGroupName()),
                projectId,
                updatedGroup.getId(),
                newParticipant,
                projectManagerName);

        log.info("User {} added successfully to project group: {}", userId, projectId);
        return toConversationResponse(updatedGroup, userId);
    }

    private String extractProjectNameFromGroupName(String groupName) {
        // Assuming the group name format is "ProjectName - Project Group"
        return groupName != null ? groupName.split(" - ")[0] : null;
    }

    private String getParticipantName(List<ParticipantInfo> participants, String userId) {
        return participants.stream()
                .filter(p -> p.getUserId().equals(userId))
                .findFirst()
                .map(p -> p.getFirstName() + " " + p.getLastName())
                .orElse("Unknown User");
    }

    public ConversationResponse removeMemberFromProjectGroup(String projectId, String userId) {
        log.info("Removing user {} from project group for project: {}", userId, projectId);

        String projectGroupHash = "PROJECT_" + projectId;
        Conversation projectGroup = conversationRepository
                .findByParticipantsHash(projectGroupHash)
                .orElseThrow(() -> new AppException(ErrorCode.CONVERSATION_NOT_FOUND));

        // Check if user is a member
        boolean isMember = projectGroup.getParticipants().stream()
                .anyMatch(participant -> participant.getUserId().equals(userId));

        if (!isMember) {
            log.info("User {} is not a member of project group: {}", userId, projectId);
            return toConversationResponse(projectGroup, userId);
        }

        // Get user information for system message
        ParticipantInfo removedParticipant = projectGroup.getParticipants().stream()
                .filter(participant -> participant.getUserId().equals(userId))
                .findFirst()
                .orElse(null);

        // Remove the participant
        projectGroup
                .getParticipants()
                .removeIf(participant -> participant.getUserId().equals(userId));
        projectGroup.setModifiedDate(Instant.now());

        Conversation updatedGroup = conversationRepository.save(projectGroup);

        // Send system message about the removed member
        if (removedParticipant != null) {
            ChatMessage removeMemberMessage = ChatMessage.builder()
                    .conversationId(updatedGroup.getId())
                    .message(removedParticipant.getFirstName() + " " + removedParticipant.getLastName()
                            + " has been removed from the project group.")
                    .type("SYSTEM_REMOVE_MEMBERS")
                    .sender(null)
                    .createdDate(Instant.now())
                    .build();

            chatMessageRepository.save(removeMemberMessage);
        }

        log.info("User {} removed successfully from project group: {}", userId, projectId);
        return toConversationResponse(updatedGroup, userId);
    }

    public List<String> getProjectGroupMembers(String projectId) {
        log.info("Getting members for project group: {}", projectId);

        String projectGroupHash = "PROJECT_" + projectId;
        Optional<Conversation> projectGroup = conversationRepository.findByParticipantsHash(projectGroupHash);

        if (projectGroup.isEmpty()) {
            log.info("Project group not found for project: {}", projectId);
            return new ArrayList<>();
        }

        return projectGroup.get().getParticipants().stream()
                .map(ParticipantInfo::getUserId)
                .collect(Collectors.toList());
    }
}
