package com.mnp.chat.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PinMessageRequest {
    String messageId;
    String conversationId;
    boolean pin; // true to pin, false to unpin
}
