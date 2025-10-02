package com.mnp.chat.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RecallMessageRequest {
    String messageId;
    String conversationId;
    String recallType; // "self" or "everyone"
}
