package com.mnp.identity.dto.request;

import java.time.LocalDate;

import com.mnp.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String username;
    String password;
    String firstName;
    String lastName;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    // Entity relationship IDs
    String departmentId;
    String positionId;
    String roleId;
    String employeeId;
    String phoneNumber;
    Double performanceScore;

    // Status fields
    Boolean isActive;
    Boolean online;
}
