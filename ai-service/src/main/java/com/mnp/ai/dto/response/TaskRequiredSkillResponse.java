package com.mnp.ai.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskRequiredSkillResponse {

    String skillType; // Maps to SkillType enum
    String requiredLevel; // Maps to ProficiencyLevel enum
    String skillName; // Human-readable skill name
    Boolean mandatory; // Whether this skill is mandatory for the task

    // Additional AI analysis fields
    Double confidenceScore; // AI confidence in skill requirement (0.0-1.0)
    String reasoningNote; // Why this skill is required
}
