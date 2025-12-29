package com.mnp.ai.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileResponse {
    String id;
    String userId;

    // User data from identity-service (wrapped object)
    UserResponse user;

    // Profile-specific data - exactly matching profile-service structure
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillResponse> skills;
    String availabilityStatus; // String representation of AvailabilityStatus enum
    Double averageTaskCompletionRate;
    Integer totalTasksCompleted;
    Integer currentWorkLoadHours;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
