package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserSkillResponseDTO {
    String id;
    String skillId;
    String skillName;
    String proficiencyLevel;
    Integer yearsOfExperience;
}
