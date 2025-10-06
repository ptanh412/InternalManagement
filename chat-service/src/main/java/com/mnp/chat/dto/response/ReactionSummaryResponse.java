package com.mnp.chat.dto.response;

import java.util.List;
import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReactionSummaryResponse {
    String icon;
    long count; // Total count across all usersz
    List<String> userIds; // List of users who reacted with this icon
    boolean reactedByMe; // Whether current user reacted with this icon
    int myReactionCount; // Number of times current user reacted with this icon
    Map<String, Integer> userReactionCounts; // Map of userId -> count for each user
    List<UserReactionInfo> users; // List of user details who reacted with this icon
}
