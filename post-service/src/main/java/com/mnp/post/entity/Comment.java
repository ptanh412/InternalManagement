package com.mnp.post.entity;
import java.time.Instant;

import org.springframework.data.mongodb.core.mapping.MongoId;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.experimental.FieldDefaults;
import lombok.Setter;
import lombok.Getter;
import lombok.Builder;
import lombok.AccessLevel;
@Document(value = "comment")
@Builder
@Setter
@Getter
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Comment {
    @MongoId
    String id;
    Integer reactionCount; // Denormalized count for performance
    Instant modifiedDate;
    Instant createdDate;
    String parentCommentId; // For nested comments/replies
    String content;
    String userId;
    String postId;
}

