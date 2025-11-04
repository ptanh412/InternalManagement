package com.mnp.profile.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.mnp.profile.enums.AvailabilityStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProfileRequest {
    String avatar;
    LocalDate dob;
    String city;
    List<UserSkillRequest> skills;
    AvailabilityStatus availabilityStatus;
    Integer currentWorkLoadHours;
}
