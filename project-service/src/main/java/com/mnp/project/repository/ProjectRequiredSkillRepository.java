package com.mnp.project.repository;

import com.mnp.project.entity.ProjectRequiredSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRequiredSkillRepository extends JpaRepository<ProjectRequiredSkill, String> {

    Optional<ProjectRequiredSkill> findByProjectIdAndSkillName(String projectId, String skillName);

    boolean existsByProjectIdAndSkillName(String projectId, String skillName);
}
