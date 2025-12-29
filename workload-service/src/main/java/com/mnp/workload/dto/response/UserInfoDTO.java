package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserInfoDTO {
    String id;
    String username;
    String email;
    boolean emailVerified;
    String firstName;
    String lastName;
    String employeeId;
    String phoneNumber;
    Double performanceScore;
    
    // Role information
    String roleName;
    String roleDescription;
    
    // Department information
    String departmentName;
    
    // Position information
    String positionTitle;
    String seniorityLevel;
    
    // Status and timestamps
    boolean isActive;
    boolean online;
    LocalDateTime lastLogin;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
