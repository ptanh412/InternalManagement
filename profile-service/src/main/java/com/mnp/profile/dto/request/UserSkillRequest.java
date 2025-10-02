package com.mnp.profile.dto.request;

import java.time.LocalDate;

import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSkillRequest {
    String skillName;
    SkillType skillType;
    ProficiencyLevel proficiencyLevel;
    Integer yearsOfExperience;
    LocalDate lastUsed;
}
