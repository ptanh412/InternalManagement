package com.devteria.chat.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReplyMessageRequest {
    @NotBlank
    String conversationId;

    @NotBlank
    String message;

    @NotBlank
    String replyToMessageId; // ID of the message being replied to
}
