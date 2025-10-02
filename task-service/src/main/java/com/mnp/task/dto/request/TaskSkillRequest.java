package com.mnp.task.dto.request;

import com.mnp.task.enums.SkillType;
import com.mnp.task.enums.ProficiencyLevel;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSkillRequest {
    @NotNull(message = "Skill type is required")
    SkillType skillType;

    @NotNull(message = "Proficiency level is required")
    ProficiencyLevel requiredLevel;

    String skillName;

    Boolean mandatory = true;
}
