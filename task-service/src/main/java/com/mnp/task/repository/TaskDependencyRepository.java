package com.mnp.task.repository;

import com.mnp.task.entity.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, String> {
    List<TaskDependency> findByTaskId(String taskId);
    List<TaskDependency> findByDependsOnTaskId(String dependsOnTaskId);
    boolean existsByTaskIdAndDependsOnTaskId(String taskId, String dependsOnTaskId);
}
