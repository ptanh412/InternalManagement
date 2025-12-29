package com.mnp.post.dto.response;


import java.time.Instant;

import lombok.experimental.FieldDefaults;
import lombok.NoArgsConstructor;
import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.AccessLevel;

@FieldDefaults(level = AccessLevel.PRIVATE)
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Data
public class CommentResponse {
    String requestId;
    Instant modifiedDate;
    Instant createdDate;
    Integer reactionCount;
    String parentCommentId;
    String content;
    String username;
    String userId;
    String postId;
    String id;
}



