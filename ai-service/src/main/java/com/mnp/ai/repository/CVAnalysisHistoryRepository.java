package com.mnp.ai.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.mnp.ai.entity.CVAnalysisHistory;

@Repository
public interface CVAnalysisHistoryRepository extends MongoRepository<CVAnalysisHistory, String> {

    // Find by created user
    List<CVAnalysisHistory> findByCreatedByOrderByCreatedAtDesc(String createdBy);

    // Find by status
    List<CVAnalysisHistory> findByStatusOrderByCreatedAtDesc(CVAnalysisHistory.AnalysisStatus status);

    // Find all ordered by created date
    List<CVAnalysisHistory> findAllByOrderByCreatedAtDesc();

    // Find by created user ID
    Optional<CVAnalysisHistory> findByCreatedUserId(String userId);

    // Find recent history (within date range)
    List<CVAnalysisHistory> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime fromDate);

    // Count by status
    long countByStatus(CVAnalysisHistory.AnalysisStatus status);

    // Check if exists by created user ID
    boolean existsByCreatedUserId(String userId);

    // Find by file name (for duplicate check)
    List<CVAnalysisHistory> findByFileNameContainingIgnoreCase(String fileName);

    // Custom query: Find by multiple statuses
    @Query("{ 'status': { $in: ?0 } }")
    List<CVAnalysisHistory> findByStatusIn(List<CVAnalysisHistory.AnalysisStatus> statuses);

    // Custom query: Find with confidence above threshold
    @Query("{ 'confidenceScore': { $gte: ?0 } }")
    List<CVAnalysisHistory> findByConfidenceScoreGreaterThanEqual(Double minConfidence);

    // Custom aggregation for average confidence (will be used in service)
    @Query(value = "{ 'status': { $in: ['ANALYZED', 'USER_CREATED'] } }", fields = "{ 'confidenceScore': 1 }")
    List<CVAnalysisHistory> findAllWithConfidenceScore();
}
