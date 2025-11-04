package com.mnp.task.repository;

import com.mnp.task.entity.TaskTimeLog;
import com.mnp.task.enums.TimeLogStatus;
import feign.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskTimeLogRepository extends JpaRepository<TaskTimeLog, String> {
    // Tìm timer đang chạy của user cho task
    Optional<TaskTimeLog> findByTaskIdAndUserIdAndStatus(
            String taskId,
            String userId,
            TimeLogStatus status
    );

    // Tìm tất cả time logs của task
    List<TaskTimeLog> findByTaskIdOrderByStartTimeDesc(String taskId);

    // Tìm tất cả time logs của user
    List<TaskTimeLog> findByUserIdOrderByStartTimeDesc(String userId);

    // Tính tổng giờ đã log cho task
    @Query("SELECT COALESCE(SUM(t.durationSeconds), 0) FROM TaskTimeLog t " +
            "WHERE t.taskId = :taskId AND t.status = 'COMPLETED'")
    Integer getTotalLoggedSecondsForTask(@Param("taskId") String taskId);

    // Tìm timer đang chạy của user (bất kỳ task nào)
    Optional<TaskTimeLog> findByUserIdAndStatus(String userId, TimeLogStatus status);
}
