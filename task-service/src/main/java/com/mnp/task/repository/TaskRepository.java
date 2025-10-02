package com.mnp.task.repository;

import com.mnp.task.entity.Task;
import com.mnp.task.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    // Updated method names to match Task entity field names
    List<Task> findByAssignedTo(String assignedTo);
    List<Task> findByCreatedBy(String createdBy);
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByProjectId(String projectId);

    // Combined filter methods
    List<Task> findByProjectIdAndStatus(String projectId, TaskStatus status);
    List<Task> findByProjectIdAndAssignedTo(String projectId, String assignedTo);
    List<Task> findByStatusAndAssignedTo(TaskStatus status, String assignedTo);
    List<Task> findByProjectIdAndStatusAndAssignedTo(String projectId, TaskStatus status, String assignedTo);

    // Custom queries for backward compatibility
    @Query("SELECT t FROM Task t WHERE t.assignedTo = :assignedTo AND t.status = :status")
    List<Task> findByAssignedToAndStatus(@Param("assignedTo") String assignedTo, @Param("status") TaskStatus status);

    @Query("SELECT t FROM Task t WHERE t.createdBy = :createdBy AND t.status = :status")
    List<Task> findByCreatedByAndStatus(@Param("createdBy") String createdBy, @Param("status") TaskStatus status);
}
