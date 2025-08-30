package com.devteria.chat.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SocketMediaMessageRequest {
    String conversationId;
    String caption; // Optional text caption for the media
    String fileUrl; // URL of the uploaded file (from file service)
    String fileName; // Original filename
    String fileType; // MIME type
    Long fileSize; // File size in bytes
    String replyToMessageId; // Optional - if this is a reply to another message
}
