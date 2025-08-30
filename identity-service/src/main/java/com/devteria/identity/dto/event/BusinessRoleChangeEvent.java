package com.devteria.identity.dto.event;

import java.time.LocalDateTime;

import com.devteria.identity.enums.BusinessRole;

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
    BusinessRole oldRole;
    BusinessRole newRole;
    String departmentId;
    String departmentName;
    String changedBy;
    LocalDateTime timestamp;
    String eventType; // "ROLE_ASSIGNED", "ROLE_UPDATED", "ROLE_REMOVED"
}
