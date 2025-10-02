package com.mnp.chat.dto.response;

import java.time.Instant;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageReactionResponse {
    String id;
    String messageId;
    String userId;
    String icon;
    Instant createdDate;
}
