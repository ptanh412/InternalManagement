package com.mnp.ai.dto;

import java.time.LocalDate;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSkillResponse {
    String id;
    String skillName;
    String skillType; // Simplified from enum to String
    String proficiencyLevel; // Simplified from enum to String
    Integer yearsOfExperience;
    LocalDate lastUsed;
}
