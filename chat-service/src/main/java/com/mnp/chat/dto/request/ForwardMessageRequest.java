package com.mnp.chat.dto.request;

import lombok.Data;

@Data
public class ForwardMessageRequest {
    private String fromUserId;
    private String toConversationId;
    private String messageId;
}
