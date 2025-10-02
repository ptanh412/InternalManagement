package com.mnp.assignment.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    String avatar;
    LocalDate dob;
    String city;
    String availabilityStatus;
    Double averageTaskCompletionRate;
    Integer totalTasksCompleted;
    Integer currentWorkLoadHours;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
