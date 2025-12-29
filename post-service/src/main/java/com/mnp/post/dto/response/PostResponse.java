package com.mnp.post.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PostResponse {
    String requestId;
    String id;
    String content;
    String userId;
    String username;
    String departmentId;
    List<String> imageUrls;
    List<String> fileUrls;
    Integer commentCount;
    Integer reactionCount;
    String created;
    Instant createdDate;
    Instant modifiedDate;
}
