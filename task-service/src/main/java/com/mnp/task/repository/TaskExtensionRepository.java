package com.mnp.task.repository;

import com.mnp.task.entity.TaskExtension;
import com.mnp.task.enums.ExtensionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TaskExtensionRepository extends JpaRepository<TaskExtension, String> {
    List<TaskExtension> findByTaskIdOrderByRequestedAtDesc(String taskId);

    List<TaskExtension> findByRequestedByOrderByRequestedAtDesc(String requestedBy);

    List<TaskExtension> findByStatusOrderByRequestedAtDesc(ExtensionStatus status);

    List<TaskExtension> findByStatusInOrderByRequestedAtDesc(List<ExtensionStatus> statuses);

    Optional<TaskExtension> findFirstByTaskIdAndStatusOrderByRequestedAtDesc(
            String taskId, ExtensionStatus status);
}
