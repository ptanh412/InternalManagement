package com.mnp.chat.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileResponse {
    String id;
    String userId;

    // User data from identity-service (nested object)
    UserResponse user;

    // Profile-specific data
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillResponse> skills;
    String availabilityStatus;
    Double averageTaskCompletionRate;
    Integer totalTasksCompleted;
    Integer currentWorkLoadHours;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
