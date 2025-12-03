package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillDto {

    private String skillName;

    private Integer proficiencyLevel; // 1-5

    private Integer yearsOfExperience;

    private String certificationLevel;

    private String lastUsed;
}
