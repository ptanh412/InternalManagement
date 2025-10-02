package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskSkillDto {
    String id;
    String skillType;
    String requiredLevel;
    String description;
    Boolean mandatory;
}
