package com.devteria.chat.dto.request;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateGroupConversationRequest {
    String groupName;
    String groupAvatar; // Optional group avatar URL
    List<String> participantIds; // List of user IDs to add to the group (excluding creator)
}
