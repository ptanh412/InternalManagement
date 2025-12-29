package com.mnp.post.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;

@Getter
@Setter
@Builder
@Document(value = "reaction")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Reaction {
    @MongoId
    String id;
    String userId;
    String targetId; // Can be postId or commentId
    ReactionType reactionType; // LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    TargetType targetType; // POST or COMMENT
    Instant createdDate;

    public enum ReactionType {
        LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    }

    public enum TargetType {
        POST, COMMENT
    }
}

