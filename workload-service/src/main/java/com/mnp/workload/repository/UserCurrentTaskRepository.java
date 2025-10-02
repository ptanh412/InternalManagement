package com.mnp.workload.repository;

import com.mnp.workload.entity.UserCurrentTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserCurrentTaskRepository extends JpaRepository<UserCurrentTask, String> {
    List<UserCurrentTask> findByUserId(String userId);
    List<UserCurrentTask> findByProjectId(String projectId);
    Optional<UserCurrentTask> findByTaskId(String taskId);

    @Query("SELECT uct FROM UserCurrentTask uct WHERE uct.userId = :userId AND uct.projectId = :projectId")
    List<UserCurrentTask> findByUserIdAndProjectId(@Param("userId") String userId, @Param("projectId") String projectId);

    @Query("SELECT SUM(uct.estimatedHours) FROM UserCurrentTask uct WHERE uct.userId = :userId")
    Integer getTotalEstimatedHoursByUserId(@Param("userId") String userId);

    @Query("SELECT SUM(uct.actualHoursSpent) FROM UserCurrentTask uct WHERE uct.userId = :userId")
    Integer getTotalActualHoursByUserId(@Param("userId") String userId);

}