package com.mnp.chat.dto.response;

import java.time.Instant;
import java.util.List;

import com.mnp.chat.entity.ChatMessage;
import com.mnp.chat.entity.ParticipantInfo;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {
    String id;
    String type; // GROUP, DIRECT
    String participantsHash;
    String conversationAvatar;
    String conversationName;
    List<ParticipantInfo> participants;
    ChatMessage lastMessage;
    int unreadCount; // Number of unread messages for the current user

    // Group conversation specific fields
    String groupName; // Name of the group (only for GROUP type)
    String createdBy; // User ID who created the conversation
    String groupAvatar; // Avatar/image for the group

    Instant createdDate;
    Instant modifiedDate;
}
