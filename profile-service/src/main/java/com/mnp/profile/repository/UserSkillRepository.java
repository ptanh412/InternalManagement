package com.mnp.profile.repository;

import java.util.List;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;

import com.mnp.profile.entity.UserSkill;
import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;

@Repository
public interface UserSkillRepository extends Neo4jRepository<UserSkill, String> {
    List<UserSkill> findBySkillNameContainingIgnoreCase(String skillName);

    List<UserSkill> findBySkillType(SkillType skillType);

    List<UserSkill> findByProficiencyLevel(ProficiencyLevel proficiencyLevel);
}
