package com.devteria.identity.dto.request;

import java.time.LocalDate;
import java.util.Set;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.validator.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminUserCreationRequest {
    @Size(min = 4, message = "USERNAME_INVALID")
    @NotBlank(message = "USERNAME_IS_REQUIRED")
    String username;

    @Size(min = 6, message = "INVALID_PASSWORD")
    @NotBlank(message = "PASSWORD_IS_REQUIRED")
    String password;

    @Email(message = "INVALID_EMAIL")
    @NotBlank(message = "EMAIL_IS_REQUIRED")
    String email;

    @NotBlank(message = "FIRST_NAME_IS_REQUIRED")
    String firstName;

    @NotBlank(message = "LAST_NAME_IS_REQUIRED")
    String lastName;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dob;

    String city;

    // Business attributes - required for admin users
    @NotBlank(message = "DEPARTMENT_ID_IS_REQUIRED")
    String departmentId;

    BusinessRole businessRole;

    @NotBlank(message = "EMPLOYEE_ID_IS_REQUIRED")
    String employeeId;

    String phoneNumber;

    // Admin-specific attributes
    Set<String> roles; // System roles (ADMIN, USER, etc.)

    boolean emailVerified; // Admin can create pre-verified users

    String position; // Job position/title

    LocalDate startDate; // Employment start date

    String managerId; // Manager/supervisor ID

    String notes; // Admin notes about the user
}
