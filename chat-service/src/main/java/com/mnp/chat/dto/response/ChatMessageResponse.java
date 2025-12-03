package com.mnp.chat.dto.response;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mnp.chat.entity.ParticipantInfo;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageResponse {
    String id;
    String conversationId;
    boolean me;
    String message;
    String type;
    String status; // SEEN, SENT
    Instant readDate;
    ParticipantInfo reader; // Keep for backward compatibility with direct conversations
    List<ParticipantInfo> readers; // List of users who have read the message in group conversations
    ParticipantInfo sender;

    @JsonFormat(shape = JsonFormat.Shape.NUMBER) // ✅ Serialize as epoch
    Instant createdDate;

    @JsonFormat(shape = JsonFormat.Shape.NUMBER) // ✅ Serialize as epoch
    Instant modifiedDate;

    String replyToMessageId; // ID of the message being replied to
    ChatMessageResponse replyToMessage; // Full reply message object
    List<ReactionSummaryResponse> reactions; // Message reactions summary

    boolean isPinned; // Whether the message is pinned
    Instant pinnedDate;

    // Recall-related fields
    @JsonProperty("isRecalled")
    boolean recalled; // Whether the message has been recalled

    String recallType; // "self" or "everyone"
    String recalledBy; // User ID who recalled the message
    Instant recalledDate; // When the message was recalled

    // Media-related fields
    String mediaUrl; // URL of the uploaded media file
    String mediaType; // Type of media (image, video, audio, document)
    String fileName; // Original filename
    Long fileSize; // File size in bytes
}
