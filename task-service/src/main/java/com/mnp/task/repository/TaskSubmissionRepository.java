package com.mnp.task.repository;

import com.mnp.task.entity.TaskSubmission;
import com.mnp.task.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskSubmissionRepository extends JpaRepository<TaskSubmission, String> {
    List<TaskSubmission> findByTaskId(String taskId);
    List<TaskSubmission> findBySubmittedBy(String submittedBy);
    List<TaskSubmission> findByStatus(SubmissionStatus status);
    List<TaskSubmission> findByReviewedBy(String reviewedBy);
    Optional<TaskSubmission> findByTaskIdAndSubmittedBy(String taskId, String submittedBy);
}
