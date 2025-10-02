package com.mnp.task.dto.response;

import com.mnp.task.enums.SkillType;
import com.mnp.task.enums.ProficiencyLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSkillResponse {
    String id;
    String taskId;
    SkillType skillType;
    ProficiencyLevel requiredLevel;
    String skillName;
}
