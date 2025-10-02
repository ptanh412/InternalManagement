package com.mnp.profile.dto.response;

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
public class UserSkillResponse {
    String id;
    String skillName;
    SkillType skillType;
    ProficiencyLevel proficiencyLevel;
    Integer yearsOfExperience;
    LocalDate lastUsed;
}
