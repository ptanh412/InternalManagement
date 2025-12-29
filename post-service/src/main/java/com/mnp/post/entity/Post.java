package com.mnp.post.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import java.time.Instant;
import java.util.List;

@Getter
@Setter
@Builder
@Document(value = "post")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Post {
    @MongoId
    String id;
    String userId;
    String departmentId; // Department group this post belongs to
    String content;
    List<String> imageUrls; // List of image URLs
    List<String> fileUrls;  // List of file URLs (documents, etc.)
    Instant createdDate;
    Instant modifiedDate;
    Integer commentCount;   // Denormalized count for performance
    Integer reactionCount;  // Denormalized count for performance
}
