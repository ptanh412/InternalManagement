package com.mnp.task.repository;

import com.mnp.task.entity.TaskBugDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TaskBugDetailRepository extends JpaRepository<TaskBugDetail, String> {
    Optional<TaskBugDetail> findByTaskId(String taskId);
    // Tìm lịch sử bug của task này (nếu task bị reject nhiều lần)
    List<TaskBugDetail> findAllByTaskIdOrderByIdentifiedAtDesc(String taskId);
}