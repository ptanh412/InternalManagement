package com.mnp.chat.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SocketEditGroupInfoRequest {
    String conversationId;

    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    String groupName;

    @Pattern(regexp = "^https?://.*\\.(jpg|jpeg|png|gif|webp)$", message = "Group avatar must be a valid image URL")
    String groupAvatar; // URL from file-service
}
