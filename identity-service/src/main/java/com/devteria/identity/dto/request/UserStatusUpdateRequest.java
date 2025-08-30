package com.devteria.identity.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserStatusUpdateRequest {
    Boolean online;
    LocalDateTime lastLogin;
}
