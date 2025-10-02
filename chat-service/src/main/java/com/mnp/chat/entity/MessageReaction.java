package com.mnp.chat.entity;

import java.time.Instant;

import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "message_reaction")
@FieldDefaults(level = AccessLevel.PRIVATE)
@CompoundIndex(def = "{'messageId': 1, 'userId': 1, 'icon': 1}", unique = true)
public class MessageReaction {
    @MongoId
    String id;

    @Indexed
    String messageId;

    @Indexed
    String userId;

    String icon; // The emoji or reaction icon

    @Builder.Default
    int count = 1; // Number of times user reacted with this icon

    @Indexed
    Instant createdDate;

    Instant modifiedDate; // Track when count was last updated
}
