package com.mnp.chat.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChatMessageRequest {
    // Either conversationId or recipientId must be provided
    String conversationId;
    
    // If recipientId is provided, conversation will be created if not exists
    String recipientId;

    @NotBlank
    String message;
}
