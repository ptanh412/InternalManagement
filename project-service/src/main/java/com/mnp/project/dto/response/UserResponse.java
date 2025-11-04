package com.mnp.project.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private LocalDate dob;
    private String phoneNumber;
    private String address;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean emailVerified;

    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else {
            return username != null ? username : email;
        }
    }
}
