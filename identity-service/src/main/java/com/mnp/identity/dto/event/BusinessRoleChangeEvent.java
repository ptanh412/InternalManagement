package com.mnp.identity.dto.event;

import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BusinessRoleChangeEvent {
    String userId;
    String username;
    String email;
    String firstName;
    String lastName;
    String oldRoleId;
    String oldRoleName;
    String newRoleId;
    String newRoleName;
    String oldPositionId;
    String oldPositionTitle;
    String newPositionId;
    String newPositionTitle;
    String departmentId;
    String departmentName;
    String changedBy;
    LocalDateTime timestamp;
    String eventType; // "ROLE_ASSIGNED", "ROLE_UPDATED", "ROLE_REMOVED", "POSITION_CHANGED"
}
