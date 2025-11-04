package com.mnp.chat.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_message")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessage {
    @MongoId
    String id;

    @Indexed
    String conversationId;

    String message;

    String type;

    String status; // SEEN, SENT

    Instant readDate;

    ParticipantInfo reader;

    @Builder.Default
    List<ParticipantInfo> readers = new ArrayList<>(); // List of users who have read the message in group conversations

    ParticipantInfo sender;

    // Additional fields for system messages
    String senderId; // For system messages, this will be "SYSTEM"
    String senderName; // For system messages, this will be "System"
    String systemType; // Type of system message (e.g., "GROUP_MEMBER_ADDED")

    String replyToMessageId; // ID of the message being replied to

    @Indexed
    Instant createdDate;

    Instant modifiedDate;

    // Recall-related fields
    boolean isRecalled; // Whether the message has been recalled
    String recallType; // "self" or "everyone"
    String recalledBy; // User ID who recalled the message
    Instant recalledDate; // When the message was recalled
    String originalMessage; // Store original message content before recall

    // Pin-related fields
    boolean isPinned; // Whether the message has been pinned
    Instant pinnedDate; // When the message was pinned
    String pinnedBy; // User ID who pinned the message

    // Media-related fields
    String mediaUrl; // URL of the uploaded media file
    String mediaType; // Type of media (image, video, audio, document)
    String fileName; // Original filename
    Long fileSize; // File size in bytes
}
