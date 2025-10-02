package com.mnp.assignment.repository;

import com.mnp.assignment.entity.AssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentHistoryRepository extends JpaRepository<AssignmentHistory, String> {

    List<AssignmentHistory> findByTaskIdOrderByReassignedAtDesc(String taskId);

    @Query("SELECT ah FROM AssignmentHistory ah WHERE ah.taskId = :taskId ORDER BY ah.reassignedAt DESC")
    List<AssignmentHistory> findAssignmentHistoryByTaskId(@Param("taskId") String taskId);
}
