package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserProfileResponseDTO {
    String id;
    String userId;
    
    // User data from identity-service
    UserInfoDTO user;
    
    // Profile-specific data
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillResponseDTO> skills;
    String availabilityStatus;
    Double averageTaskCompletionRate;
    Integer totalTasksCompleted;
    Integer currentWorkLoadHours;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
