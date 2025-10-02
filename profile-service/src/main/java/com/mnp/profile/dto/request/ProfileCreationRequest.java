package com.mnp.profile.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.mnp.profile.enums.AvailabilityStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileCreationRequest {
    String userId; // Reference to user in identity-service
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillRequest> skills;
    AvailabilityStatus availabilityStatus;
}
