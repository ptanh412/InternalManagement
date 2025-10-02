package com.mnp.project.dto.response;

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
    String type; // GROUP, DIRECT
    String participantsHash;
    String conversationAvatar;
    String conversationName;
    List<ParticipantInfo> participants;
    Object lastMessage; // Using Object to avoid circular dependencies
    int unreadCount; // Number of unread messages for the current user

    // Group conversation specific fields
    String groupName; // Name of the group (only for GROUP type)
    String createdBy; // User ID who created the conversation
    String groupAvatar; // Avatar/image for the group
    String projectId; // Project ID for project-specific groups

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
        String role; // PROJECT_LEADER, TEAM_LEAD, MEMBER, etc.
    }
}
