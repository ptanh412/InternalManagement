package com.mnp.chat.dto.response;

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
    String proficiencyLevel;
    Integer yearsOfExperience;
}
