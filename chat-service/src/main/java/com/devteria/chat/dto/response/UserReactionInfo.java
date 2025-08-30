package com.devteria.chat.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserReactionInfo {
    String userId;
    String username;
    String firstName;
    String lastName;
    String avatar;
    int reactionCount;
}
