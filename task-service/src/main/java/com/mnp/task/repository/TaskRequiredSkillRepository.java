package com.mnp.task.repository;

import com.mnp.task.entity.TaskRequiredSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRequiredSkillRepository extends JpaRepository<TaskRequiredSkill, String> {
    List<TaskRequiredSkill> findByTaskId(String taskId);
    void deleteByTaskId(String taskId);
}
