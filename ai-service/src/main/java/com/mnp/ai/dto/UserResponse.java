package com.mnp.ai.dto;

import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String firstName;
    String lastName;
    String email;
    String employeeId;
    String departmentName;
    String roleName;
    String roleDescription;
    String positionTitle;
    String seniorityLevel;
    Boolean isActive;
    Boolean emailVerified;
    Boolean online;
    LocalDateTime createdDate;
    LocalDateTime lastModifiedDate;
}
