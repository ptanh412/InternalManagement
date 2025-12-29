package com.mnp.post.dto.request;

import com.mnp.post.entity.Reaction;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReactionRequest {
    String requestId;
    String targetId; // postId or commentId
    Reaction.ReactionType reactionType;
    Reaction.TargetType targetType; // POST or COMMENT
}

