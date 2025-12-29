package com.mnp.task.repository;

import com.mnp.task.entity.TaskCommit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TaskCommitRepository extends JpaRepository<TaskCommit, String> {
    List<TaskCommit> findByTaskIdOrderByCommittedAtDesc(String taskId);
    boolean existsByCommitHash(String commitHash);
}