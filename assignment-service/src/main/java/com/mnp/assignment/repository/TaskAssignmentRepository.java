package com.mnp.assignment.repository;

import com.mnp.assignment.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, String> {

    List<TaskAssignment> findByCandidateUserId(String candidateUserId);

    List<TaskAssignment> findByTaskId(String taskId);

    @Query("SELECT ta FROM TaskAssignment ta WHERE ta.candidateUserId = :userId AND ta.isSelected = true")
    List<TaskAssignment> findActiveAssignmentsByUserId(@Param("userId") String userId);

    boolean existsByTaskIdAndCandidateUserId(String taskId, String candidateUserId);
}
