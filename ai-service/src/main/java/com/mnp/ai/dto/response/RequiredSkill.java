package com.mnp.ai.dto.response;

import com.mnp.ai.enums.ProficiencyLevel;
import com.mnp.ai.enums.SkillType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequiredSkill {
    private SkillType skillType;
    private ProficiencyLevel requiredLevel;
    private String skillName;
    private Boolean mandatory;
}
