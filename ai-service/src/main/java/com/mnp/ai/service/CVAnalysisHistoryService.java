package com.mnp.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.ai.dto.request.UserCreatedRequest;
import com.mnp.ai.dto.response.CVAnalysisHistoryResponse;
import com.mnp.ai.dto.response.CVAnalysisResult;
import com.mnp.ai.dto.response.CVAnalysisStatsResponse;
import com.mnp.ai.dto.response.ParsedUserProfile;
import com.mnp.ai.entity.CVAnalysisHistory;
import com.mnp.ai.exception.AppException;
import com.mnp.ai.exception.ErrorCode;
import com.mnp.ai.repository.CVAnalysisHistoryRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CVAnalysisHistoryService {

    CVAnalysisHistoryRepository historyRepository;
    ObjectMapper objectMapper;

    /**
     * Save CV analysis history after AI analysis
     */
    public CVAnalysisHistory saveAnalysisHistory(
            String fileName,
            Long fileSize,
            String fileType,
            CVAnalysisResult analysisResult,
            String uploadedBy) {

        try {
            CVAnalysisHistory history = CVAnalysisHistory.builder()
                    .fileName(fileName)
                    .fileSize(fileSize)
                    .fileType(fileType)
                    .status(CVAnalysisHistory.AnalysisStatus.ANALYZED)
                    .confidenceScore(analysisResult.getConfidence())
                    .processingTimeMs(analysisResult.getProcessingTime())
                    .analysisResultJson(objectMapper.writeValueAsString(analysisResult.getUserProfile()))
                    .createdBy(uploadedBy)
                    .build();

            history.onCreate(); // Set timestamps
            history = historyRepository.save(history);

            log.info("✓ Saved CV analysis history to MongoDB with ID: {}", history.getId());

            return history;

        } catch (Exception e) {
            log.error("❌ Failed to save CV analysis history to MongoDB: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save analysis history", e);
        }
    }

    /**
     * Save failed analysis to history
     */
    public CVAnalysisHistory saveFailedAnalysis(
            String fileName,
            Long fileSize,
            String fileType,
            String errorMessage,
            String uploadedBy) {

        try {
            CVAnalysisHistory history = CVAnalysisHistory.builder()
                    .fileName(fileName)
                    .fileSize(fileSize)
                    .fileType(fileType)
                    .status(CVAnalysisHistory.AnalysisStatus.FAILED)
                    .errorMessage(errorMessage)
                    .confidenceScore(0.0)
                    .processingTimeMs(0L)
                    .createdBy(uploadedBy)
                    .build();

            history.onCreate();
            history = historyRepository.save(history);

            log.info("✓ Saved failed CV analysis history with ID: {}", history.getId());

            return history;

        } catch (Exception e) {
            log.error("❌ Failed to save failed analysis history: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save failed analysis history", e);
        }
    }

    /**
     * Update history after user creation
     */
    public void updateHistoryWithCreatedUser(String historyId, UserCreatedRequest request) {
        CVAnalysisHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new AppException(ErrorCode.HISTORY_NOT_FOUND));


        history.setCreatedUserId(request.getUserId());
        history.setCreatedUsername(request.getUsername());
        history.setCreatedUserEmail(request.getEmail());
        history.setStatus(CVAnalysisHistory.AnalysisStatus.USER_CREATED);
        history.onUpdate();

        historyRepository.save(history);

        historyRepository.save(history);
        log.info("✓ Updated MongoDB history {} with created user {}", historyId, request.getUserId());
    }

    /**
     * Mark history as failed
     */
    public void markAsFailed(String historyId, String errorMessage) {
        CVAnalysisHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new AppException(ErrorCode.HISTORY_NOT_FOUND));

        history.setStatus(CVAnalysisHistory.AnalysisStatus.FAILED);
        history.setErrorMessage(errorMessage);
        history.onUpdate();

        historyRepository.save(history);
        log.info("✓ Marked MongoDB history {} as failed", historyId);
    }

    /**
     * Get all analysis history
     */
    public List<CVAnalysisHistoryResponse> getAllHistory() {
        List<CVAnalysisHistory> histories = historyRepository.findAllByOrderByCreatedAtDesc();
        log.info("Retrieved {} CV analysis histories from MongoDB", histories.size());

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get history by admin user
     */
    public List<CVAnalysisHistoryResponse> getHistoryByUser(String userId) {
        List<CVAnalysisHistory> histories = historyRepository.findByCreatedByOrderByCreatedAtDesc(userId);
        log.info("Retrieved {} histories for user {} from MongoDB", histories.size(), userId);

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get history by status
     */
    public List<CVAnalysisHistoryResponse> getHistoryByStatus(CVAnalysisHistory.AnalysisStatus status) {
        List<CVAnalysisHistory> histories = historyRepository.findByStatusOrderByCreatedAtDesc(status);

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get recent history (last N days)
     */
    public List<CVAnalysisHistoryResponse> getRecentHistory(int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        List<CVAnalysisHistory> histories = historyRepository.findByCreatedAtAfterOrderByCreatedAtDesc(fromDate);

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get statistics
     */
    public CVAnalysisStatsResponse getStatistics() {
        long totalAnalyzed = historyRepository.count();
        long totalUsersCreated = historyRepository.countByStatus(CVAnalysisHistory.AnalysisStatus.USER_CREATED);
        long pendingAnalysis = historyRepository.countByStatus(CVAnalysisHistory.AnalysisStatus.PENDING);
        long failedAnalysis = historyRepository.countByStatus(CVAnalysisHistory.AnalysisStatus.FAILED);

        // Calculate average confidence from MongoDB
        Double avgConfidence = calculateAverageConfidence();

        double successRate = totalAnalyzed > 0 ? (double) totalUsersCreated / totalAnalyzed : 0.0;

        // Get status distribution
        Map<String, Long> analysisByStatus = getAnalysisCountByStatus();

        log.info("Generated statistics from MongoDB: {} total, {} users created",
                totalAnalyzed, totalUsersCreated);

        return CVAnalysisStatsResponse.builder()
                .totalAnalyzed(totalAnalyzed)
                .totalUsersCreated(totalUsersCreated)
                .pendingAnalysis(pendingAnalysis)
                .failedAnalysis(failedAnalysis)
                .averageConfidence(avgConfidence)
                .successRate(successRate)
                .analysisByStatus(analysisByStatus)
                .build();
    }

    /**
     * Calculate average confidence score
     */
    private Double calculateAverageConfidence() {
        List<CVAnalysisHistory> historiesWithConfidence = historyRepository.findAllWithConfidenceScore();

        if (historiesWithConfidence.isEmpty()) {
            return 0.0;
        }

        double sum = historiesWithConfidence.stream()
                .filter(h -> h.getConfidenceScore() != null)
                .filter(h -> h.getStatus() == CVAnalysisHistory.AnalysisStatus.ANALYZED ||
                        h.getStatus() == CVAnalysisHistory.AnalysisStatus.USER_CREATED)
                .mapToDouble(CVAnalysisHistory::getConfidenceScore)
                .sum();

        long count = historiesWithConfidence.stream()
                .filter(h -> h.getConfidenceScore() != null)
                .filter(h -> h.getStatus() == CVAnalysisHistory.AnalysisStatus.ANALYZED ||
                        h.getStatus() == CVAnalysisHistory.AnalysisStatus.USER_CREATED)
                .count();

        return count > 0 ? sum / count : 0.0;
    }

    /**
     * Get analysis count by status
     */
    private Map<String, Long> getAnalysisCountByStatus() {
        Map<String, Long> statusMap = new HashMap<>();

        for (CVAnalysisHistory.AnalysisStatus status : CVAnalysisHistory.AnalysisStatus.values()) {
            long count = historyRepository.countByStatus(status);
            statusMap.put(status.name(), count);
        }

        return statusMap;
    }

    /**
     * Get analysis history detail
     */
    public CVAnalysisHistoryResponse getHistoryDetail(String historyId) {
        CVAnalysisHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new AppException(ErrorCode.HISTORY_NOT_FOUND));

        log.info("Retrieved history detail from MongoDB for ID: {}", historyId);

        return toResponse(history);
    }

    /**
     * Delete history by ID
     */
    public void deleteHistory(String historyId) {
        if (!historyRepository.existsById(historyId)) {
            throw new AppException(ErrorCode.HISTORY_NOT_FOUND);
        }

        historyRepository.deleteById(historyId);
        log.info("✓ Deleted history {} from MongoDB", historyId);
    }

    /**
     * Search history by file name
     */
    public List<CVAnalysisHistoryResponse> searchByFileName(String fileName) {
        List<CVAnalysisHistory> histories = historyRepository.findByFileNameContainingIgnoreCase(fileName);

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get high confidence analyses (>= 0.8)
     */
    public List<CVAnalysisHistoryResponse> getHighConfidenceAnalyses() {
        List<CVAnalysisHistory> histories = historyRepository.findByConfidenceScoreGreaterThanEqual(0.8);

        return histories.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Convert entity to response DTO
     */
    private CVAnalysisHistoryResponse toResponse(CVAnalysisHistory history) {
        CVAnalysisHistoryResponse.CVAnalysisHistoryResponseBuilder builder =
                CVAnalysisHistoryResponse.builder()
                        .id(history.getId())
                        .fileName(history.getFileName())
                        .fileSize(history.getFileSize())
                        .fileType(history.getFileType())
                        .cvFileUrl(history.getCvFileUrl())
                        .status(history.getStatus().name())
                        .confidenceScore(history.getConfidenceScore())
                        .processingTimeMs(history.getProcessingTimeMs())
                        .createdBy(history.getCreatedBy())
                        .analyzedAt(history.getCreatedAt())
                        .errorMessage(history.getErrorMessage())
                        .notes(history.getNotes())
                        .createdUserId(history.getCreatedUserId())
                        .createdUsername(history.getCreatedUsername())
                        .createdUserEmail(history.getCreatedUserEmail());
        try {
            if (history.getAnalysisResultJson() != null && !history.getAnalysisResultJson().isEmpty()) {
                ParsedUserProfile profile = objectMapper.readValue(
                        history.getAnalysisResultJson(),
                        ParsedUserProfile.class
                );

                builder.extractedName(profile.getName())
                        .extractedEmail(profile.getEmail())
                        .extractedPhone(profile.getPhone())
                        .extractedDepartment(profile.getDepartment())
                        .extractedSeniority(profile.getSeniority())
                        .totalSkills(profile.getSkills() != null ? profile.getSkills().size() : 0);
            }
        } catch (Exception e) {
            log.warn("Failed to parse analysis result JSON for history {}: {}",
                    history.getId(), e.getMessage());
        }

        return builder.build();
    }
}
