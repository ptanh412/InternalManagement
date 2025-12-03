package com.internalmanagement.mlservice.repository;

import com.internalmanagement.mlservice.entity.MLTrainingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for ML training events
 */
@Repository
public interface MLTrainingEventRepository extends JpaRepository<MLTrainingEvent, Long> {

    /**
     * Find unprocessed events
     */
    List<MLTrainingEvent> findByProcessedFalse();

    /**
     * Find events by type
     */
    List<MLTrainingEvent> findByEventType(MLTrainingEvent.EventType eventType);

    /**
     * Find events for a specific task
     */
    List<MLTrainingEvent> findByTaskIdOrderByCreatedAtDesc(String taskId);

    /**
     * Find events for a specific user
     */
    List<MLTrainingEvent> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Find events in date range
     */
    @Query("SELECT e FROM MLTrainingEvent e WHERE e.createdAt BETWEEN :startDate AND :endDate ORDER BY e.createdAt DESC")
    List<MLTrainingEvent> findEventsInDateRange(@Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    /**
     * Count events by type
     */
    @Query("SELECT COUNT(e) FROM MLTrainingEvent e WHERE e.eventType = :eventType")
    Long countByEventType(@Param("eventType") MLTrainingEvent.EventType eventType);
}
