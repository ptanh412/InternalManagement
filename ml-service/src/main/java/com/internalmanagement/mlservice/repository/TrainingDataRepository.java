package com.internalmanagement.mlservice.repository;

import com.internalmanagement.mlservice.entity.TrainingData;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository for ML training data
 */
@Repository
public interface TrainingDataRepository extends JpaRepository<TrainingData, Long> {

    /**
     * Find training data by task ID
     */
    List<TrainingData> findByTaskId(String taskId);

    /**
     * Find training data by user ID
     */
    List<TrainingData> findByUserId(String userId);

    /**
     * Find training data within date range
     */
    @Query("SELECT td FROM TrainingData td WHERE td.createdAt BETWEEN :startDate AND :endDate")
    List<TrainingData> findByDateRange(@Param("startDate") LocalDateTime startDate, 
                                      @Param("endDate") LocalDateTime endDate);

    /**
     * Find training data for model training (with performance scores)
     */
    @Query("SELECT td FROM TrainingData td WHERE td.performanceScore IS NOT NULL ORDER BY td.createdAt DESC")
    Page<TrainingData> findTrainingDataForML(Pageable pageable);

    /**
     * Get latest training data for continuous learning
     */
    @Query("SELECT td FROM TrainingData td WHERE td.createdAt >= :cutoffDate AND td.performanceScore IS NOT NULL")
    List<TrainingData> findLatestTrainingData(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Count records by data source
     */
    @Query("SELECT td.dataSource, COUNT(td) FROM TrainingData td GROUP BY td.dataSource")
    List<Object[]> countByDataSource();

    /**
     * Find high-performance assignments for analysis
     */
    @Query("SELECT td FROM TrainingData td WHERE td.performanceScore >= :threshold ORDER BY td.performanceScore DESC")
    List<TrainingData> findHighPerformanceAssignments(@Param("threshold") Double threshold);

    /**
     * Get average performance by seniority level
     */
    @Query("SELECT td.seniorityLevel, AVG(td.performanceScore) FROM TrainingData td " +
           "WHERE td.performanceScore IS NOT NULL GROUP BY td.seniorityLevel")
    List<Object[]> getAveragePerformanceBySeniority();

    /**
     * Get average performance by department
     */
    @Query("SELECT td.departmentName, AVG(td.performanceScore) FROM TrainingData td " +
           "WHERE td.performanceScore IS NOT NULL GROUP BY td.departmentName")
    List<Object[]> getAveragePerformanceByDepartment();

    /**
     * Find records needing skill match calculation
     */
    @Query("SELECT td FROM TrainingData td WHERE td.requiredSkills IS NOT EMPTY")
    List<TrainingData> findRecordsWithSkills();

    /**
     * Get training data statistics
     */
    @Query("SELECT COUNT(td), AVG(td.performanceScore), MIN(td.createdAt), MAX(td.createdAt) FROM TrainingData td")
    Object[] getTrainingDataStatistics();

    /**
     * Find duplicate records (same task and user)
     */
    @Query("SELECT td FROM TrainingData td WHERE EXISTS " +
           "(SELECT td2 FROM TrainingData td2 WHERE td2.taskId = td.taskId AND td2.userId = td.userId AND td2.id != td.id)")
    List<TrainingData> findDuplicateRecords();

    /**
     * Find records by priority and difficulty
     */
    List<TrainingData> findByPriorityAndDifficulty(String priority, String difficulty);

    /**
     * Find completed tasks only
     */
    @Query("SELECT td FROM TrainingData td WHERE td.completionDate IS NOT NULL")
    List<TrainingData> findCompletedTasks();

    /**
     * Find records with performance data for specific time period
     */
    @Query("SELECT td FROM TrainingData td WHERE td.performanceScore IS NOT NULL " +
           "AND td.createdAt >= :startDate AND td.createdAt <= :endDate")
    List<TrainingData> findPerformanceDataInPeriod(@Param("startDate") LocalDateTime startDate,
                                                   @Param("endDate") LocalDateTime endDate);
}