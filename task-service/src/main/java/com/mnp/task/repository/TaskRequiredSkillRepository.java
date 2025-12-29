package com.mnp.task.repository;

import com.mnp.task.entity.TaskRequiredSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface TaskRequiredSkillRepository extends JpaRepository<TaskRequiredSkill, String> {
    List<TaskRequiredSkill> findByTaskId(String taskId);
    void deleteByTaskId(String taskId);
    
    /**
     * Batch fetch required skills for multiple tasks
     * This prevents N+1 query problem
     */
    @Query("SELECT trs FROM TaskRequiredSkill trs WHERE trs.taskId IN :taskIds")
    List<TaskRequiredSkill> findByTaskIdIn(@Param("taskIds") List<String> taskIds);
    
    /**
     * Helper method to group skills by taskId
     */
    default Map<String, List<TaskRequiredSkill>> findByTaskIdInGrouped(List<String> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return Map.of();
        }
        
        return findByTaskIdIn(taskIds).stream()
            .collect(Collectors.groupingBy(TaskRequiredSkill::getTaskId));
    }
}

