package com.mnp.assignment.dto.response;

import java.time.Instant;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConversationResponse {
    String id;
    String type;
    String participantsHash;
    String conversationAvatar;
    String conversationName;
    List<ParticipantInfo> participants;
    Object lastMessage; // Using Object to avoid circular dependencies
    int unreadCount;
    String groupName;
    String createdBy;
    String groupAvatar;
    Instant createdDate;
    Instant modifiedDate;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ParticipantInfo {
        String userId;
        String username;
        String firstName;
        String lastName;
        String avatar;
    }
}
