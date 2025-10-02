package com.mnp.identity.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.mnp.identity.enums.AvailabilityStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProfileCreationRequest {
    String userId; // Reference to user in identity-service
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillRequest> skills;
    AvailabilityStatus availabilityStatus;
}
