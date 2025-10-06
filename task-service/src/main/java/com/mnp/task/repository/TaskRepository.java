package com.mnp.task.repository;

import com.mnp.task.entity.Task;
import com.mnp.task.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, String> {

    // Updated method names to match Task entity field names
    List<Task> findByAssignedTo(String assignedTo);
    List<Task> findByCreatedBy(String createdBy);
    List<Task> findByStatus(TaskStatus status);
    List<Task> findByProjectId(String projectId);
    List<Task> findByProjectIdIn(List<String> projectIds);

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

    // Custom queries for reminder notifications
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :now AND :next24Hours AND t.status NOT IN ('DONE', 'CANCELLED') AND t.assignedTo IS NOT NULL")
    List<Task> findTasksDueWithin24Hours(@Param("now") LocalDateTime now, @Param("next24Hours") LocalDateTime next24Hours);

    @Query("SELECT t FROM Task t WHERE t.dueDate <= :now AND t.status NOT IN ('DONE', 'CANCELLED') AND t.assignedTo IS NOT NULL")
    List<Task> findOverdueTasks(@Param("now") LocalDateTime now);

    // Convenience method that will be called from service
    default List<Task> findTasksDueWithin24Hours() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next24Hours = now.plusHours(24);
        return findTasksDueWithin24Hours(now, next24Hours);
    }
}
