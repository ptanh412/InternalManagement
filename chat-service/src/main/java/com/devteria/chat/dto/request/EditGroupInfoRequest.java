package com.devteria.chat.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EditGroupInfoRequest {
    @Size(min = 1, max = 100, message = "Group name must be between 1 and 100 characters")
    String groupName;

    String groupAvatar; // URL or file path to the new avatar
}
