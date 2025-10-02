package com.mnp.profile.dto.interservice;

import java.time.LocalDate;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InterServiceProfileCreationRequest {
    String userId; // Reference to user in identity-service
    String avatar;
    LocalDate dob;
    String city;
    List<InterServiceUserSkillRequest> skills;
    String availabilityStatus; // String instead of enum for cross-service compatibility
}
