package com.mnp.ai.entity;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequiredSkillInfo {
    String skillName;
    String skillCategory; // PROGRAMMING_LANGUAGE, FRAMEWORK, DATABASE, TOOL, SOFT_SKILL
    Integer requiredLevel; // 1-5 scale
    Integer priority; // 1-5 scale (1 = highest priority)
    String description;
    Boolean isMandatory;
    Double weightage; // For scoring algorithms
}
