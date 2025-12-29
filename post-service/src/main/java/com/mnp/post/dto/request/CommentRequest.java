package com.mnp.post.dto.request;

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
public class CommentRequest {
    String commentId;
    String requestId;
    String parentCommentId; // Optional, for replies
    String content;

    String postId;
}



