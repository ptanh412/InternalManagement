package com.mnp.post.dto.response;

import com.mnp.post.entity.Reaction;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReactionResponse {
    String requestId;
    String id;
    String userId;
    String username;
    String targetId;
    Reaction.ReactionType reactionType;
    Reaction.TargetType targetType;
    Instant createdDate;
}

