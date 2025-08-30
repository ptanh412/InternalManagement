package com.devteria.identity.dto.request;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String password;
    String firstName;
    String lastName;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    List<String> roles;

    // New business attributes
    String departmentId;
    BusinessRole businessRole;
    String employeeId;
    String phoneNumber;
    String city;
    boolean isActive;

    // Online status and last login (for admin/manual update if needed)
    Boolean online;
    LocalDateTime lastLogin;
}
