package com.devteria.identity.dto.response;

import java.time.LocalDateTime;
import java.util.Set;

import com.devteria.identity.enums.BusinessRole;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String email;
    boolean emailVerified;
    Set<RoleResponse> roles;

    // New business attributes
    String departmentId;
    String departmentName;
    BusinessRole businessRole;
    String businessRoleDisplayName;
    String firstName;
    String lastName;
    String employeeId;
    String phoneNumber;
    LocalDateTime joinDate;
    boolean isActive;

    // Online status and last login
    boolean online;
    LocalDateTime lastLogin;
}
