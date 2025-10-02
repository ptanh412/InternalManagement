package com.mnp.profile.entity;

import java.time.LocalDate;

import org.springframework.data.neo4j.core.schema.GeneratedValue;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.support.UUIDStringGenerator;

import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Node("user_skill")
public class UserSkill {
    @Id
    @GeneratedValue(generatorClass = UUIDStringGenerator.class)
    String id;

    String skillName;
    SkillType skillType;
    ProficiencyLevel proficiencyLevel;
    Integer yearsOfExperience;
    LocalDate lastUsed;
}
