package com.internalmanagement.mlservice.repository;

import com.internalmanagement.mlservice.entity.ModelTrainingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for model training history
 */
@Repository
public interface ModelTrainingHistoryRepository extends JpaRepository<ModelTrainingHistory, Long> {

    /**
     * Find latest training record
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth ORDER BY mth.trainingDate DESC")
    Optional<ModelTrainingHistory> findLatestTraining();

    /**
     * Find training history within date range
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.trainingDate BETWEEN :startDate AND :endDate ORDER BY mth.trainingDate DESC")
    List<ModelTrainingHistory> findByDateRange(@Param("startDate") LocalDateTime startDate,
                                              @Param("endDate") LocalDateTime endDate);

    /**
     * Find successful deployments only
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.deploymentStatus = 'DEPLOYED' ORDER BY mth.trainingDate DESC")
    List<ModelTrainingHistory> findSuccessfulDeployments();

    /**
     * Find failed training attempts
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.deploymentStatus = 'FAILED' ORDER BY mth.trainingDate DESC")
    List<ModelTrainingHistory> findFailedTrainings();

    /**
     * Find by model version
     */
    Optional<ModelTrainingHistory> findByModelVersion(String modelVersion);

    /**
     * Get training performance trend (last N records)
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth ORDER BY mth.trainingDate DESC")
    List<ModelTrainingHistory> findRecentTrainings(@Param("limit") int limit);

    /**
     * Get average performance metrics
     */
    @Query("SELECT AVG(mth.accuracy), AVG(mth.f1Score), AVG(mth.precisionScore), AVG(mth.recallScore) " +
           "FROM ModelTrainingHistory mth WHERE mth.deploymentStatus = 'DEPLOYED'")
    Object[] getAveragePerformanceMetrics();

    /**
     * Find best performing model
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.deploymentStatus = 'DEPLOYED' " +
           "ORDER BY mth.f1Score DESC, mth.accuracy DESC")
    Optional<ModelTrainingHistory> findBestPerformingModel();

    /**
     * Count training attempts by status
     */
    @Query("SELECT mth.deploymentStatus, COUNT(mth) FROM ModelTrainingHistory mth GROUP BY mth.deploymentStatus")
    List<Object[]> countByDeploymentStatus();

    /**
     * Find models with performance above threshold
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.f1Score >= :threshold ORDER BY mth.f1Score DESC")
    List<ModelTrainingHistory> findModelsAboveThreshold(@Param("threshold") Double threshold);

    /**
     * Get training frequency analysis
     */
    @Query("SELECT DATE(mth.trainingDate), COUNT(mth) FROM ModelTrainingHistory mth " +
           "WHERE mth.trainingDate >= :startDate GROUP BY DATE(mth.trainingDate)")
    List<Object[]> getTrainingFrequency(@Param("startDate") LocalDateTime startDate);

    /**
     * Find models with significant improvement
     */
    @Query("SELECT mth FROM ModelTrainingHistory mth WHERE mth.f1Improvement >= :improvement ORDER BY mth.f1Improvement DESC")
    List<ModelTrainingHistory> findModelsWithImprovement(@Param("improvement") Double improvement);

    /**
     * Get latest model version
     */
    @Query("SELECT mth.modelVersion FROM ModelTrainingHistory mth ORDER BY mth.trainingDate DESC")
    Optional<String> getLatestModelVersion();

    /**
     * Check if retraining is needed based on time
     */
    @Query("SELECT CASE WHEN MAX(mth.trainingDate) < :threshold THEN true ELSE false END " +
           "FROM ModelTrainingHistory mth WHERE mth.deploymentStatus = 'DEPLOYED'")
    Boolean isRetrainingNeeded(@Param("threshold") LocalDateTime threshold);

    /**
     * Get model performance degradation
     */
    @Query("SELECT mth1.f1Score - mth2.f1Score FROM ModelTrainingHistory mth1, ModelTrainingHistory mth2 " +
           "WHERE mth1.trainingDate = (SELECT MAX(mth3.trainingDate) FROM ModelTrainingHistory mth3 WHERE mth3.deploymentStatus = 'DEPLOYED') " +
           "AND mth2.trainingDate = (SELECT MAX(mth4.trainingDate) FROM ModelTrainingHistory mth4 WHERE mth4.deploymentStatus = 'DEPLOYED' AND mth4.trainingDate < mth1.trainingDate)")
    Optional<Double> getLatestPerformanceChange();
}