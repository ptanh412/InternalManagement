package com.mnp.task.entity;

import com.mnp.task.enums.ProficiencyLevel;
import com.mnp.task.enums.SkillType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "task_required_skills")
public class TaskRequiredSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String taskId;

    @Enumerated(EnumType.STRING)
    SkillType skillType;

    @Enumerated(EnumType.STRING)
    ProficiencyLevel requiredLevel;

    String skillName;

    Boolean mandatory = true;
}
