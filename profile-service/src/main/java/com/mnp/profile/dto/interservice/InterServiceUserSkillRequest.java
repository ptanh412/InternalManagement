package com.mnp.profile.dto.interservice;

import java.time.LocalDate;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InterServiceUserSkillRequest {
    String skillName;
    String skillType; // String instead of enum for cross-service compatibility
    String proficiencyLevel; // String instead of enum for cross-service compatibility
    Integer yearsOfExperience;
    LocalDate lastUsed;
    String description;
}
