package com.mnp.identity.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.PerformanceUpdateRequest;
import com.mnp.identity.dto.response.PerformanceDetailsResponse;
import com.mnp.identity.entity.User;
import com.mnp.identity.exception.AppException;
import com.mnp.identity.exception.ErrorCode;
import com.mnp.identity.repository.UserRepository;
import com.mnp.identity.repository.httpclient.TaskServiceClient;
import com.mnp.identity.repository.httpclient.TaskServiceClient.TaskMetricsResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PerformanceCalculationService {

    UserRepository userRepository;
    TaskServiceClient taskServiceClient;

    /**
     * Calculate and update performance score for a user based on their task completion metrics
     */
    @Transactional
    public Double calculateAndUpdatePerformanceScore(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Get user's task performance data from task service
        var taskMetrics = taskServiceClient.getUserTaskMetrics(userId);
        
        if (taskMetrics == null || taskMetrics.getResult() == null) {
            log.warn("No task metrics found for user: {}", userId);
            return user.getPerformanceScore();
        }

        var metrics = taskMetrics.getResult();
        
        // Calculate performance score based on multiple factors
        double performanceScore = calculatePerformanceScore(
            metrics.getTotalTasks(),
            metrics.getCompletedTasks(),
            metrics.getAverageQualityRating(),
            metrics.getOnTimeCompletionRate(),
            metrics.getAverageTaskDuration(),
            metrics.getEstimatedActualRatio()
        );

        // Update user's performance score
        user.setPerformanceScore(performanceScore);
        userRepository.save(user);

        log.info("Performance score updated for user {}: {}", userId, performanceScore);
        return performanceScore;
    }

    /**
     * Update performance score based on a specific task review
     */
    @Transactional
    public Double updatePerformanceScoreAfterTaskReview(PerformanceUpdateRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Get current performance score or initialize if null
        Double currentScore = user.getPerformanceScore() != null ? user.getPerformanceScore() : 70.0;

        // Calculate score impact based on task performance
        double scoreImpact = calculateTaskScoreImpact(
            request.getQualityRating(),
            request.isCompletedOnTime(),
            request.getTaskComplexity(),
            request.getEstimatedHours(),
            request.getActualHours()
        );

        // Apply weighted update to existing score (70% existing, 30% new impact)
        double newScore = (currentScore * 0.7) + (scoreImpact * 0.3);
        
        // Ensure score is within valid range (0-100)
        newScore = Math.max(0.0, Math.min(100.0, newScore));

        user.setPerformanceScore(newScore);
        userRepository.save(user);

        log.info("Performance score updated for user {} after task review: {} -> {}", 
                request.getUserId(), currentScore, newScore);
        
        return newScore;
    }

    /**
     * Calculate performance score based on aggregated metrics
     */
    private double calculatePerformanceScore(
            int totalTasks,
            int completedTasks, 
            Double averageQualityRating,
            Double onTimeCompletionRate,
            Double averageTaskDuration,
            Double estimatedActualRatio) {

        if (totalTasks == 0) {
            return 70.0; // Default neutral score for new users
        }

        // Weight factors for different performance aspects
        double qualityWeight = 0.35;      // 35% - Quality of work
        double timelinessWeight = 0.25;   // 25% - Meeting deadlines
        double completionWeight = 0.20;   // 20% - Task completion rate
        double efficiencyWeight = 0.20;   // 20% - Time estimation accuracy

        // Calculate individual scores (0-100)
        double qualityScore = calculateQualityScore(averageQualityRating);
        double timelinessScore = calculateTimelinessScore(onTimeCompletionRate);
        double completionScore = calculateCompletionScore(totalTasks, completedTasks);
        double efficiencyScore = calculateEfficiencyScore(estimatedActualRatio);

        // Calculate weighted average
        double performanceScore = (qualityScore * qualityWeight) +
                                (timelinessScore * timelinessWeight) +
                                (completionScore * completionWeight) +
                                (efficiencyScore * efficiencyWeight);

        // Ensure score is within valid range
        return Math.max(0.0, Math.min(100.0, performanceScore));
    }

    /**
     * Calculate score impact for a single task review
     */
    private double calculateTaskScoreImpact(
            Integer qualityRating,
            boolean completedOnTime,
            String taskComplexity,
            Integer estimatedHours,
            Integer actualHours) {

        // Base score components
        double qualityComponent = qualityRating != null ? (qualityRating * 20.0) : 70.0; // 1-5 rating * 20
        double timelinessComponent = completedOnTime ? 90.0 : 50.0;
        
        // Efficiency component based on estimated vs actual hours
        double efficiencyComponent = 70.0; // default
        if (estimatedHours != null && actualHours != null && estimatedHours > 0) {
            double ratio = (double) actualHours / estimatedHours;
            if (ratio <= 1.0) {
                efficiencyComponent = 100.0 - (ratio * 10.0); // Bonus for completing under estimate
            } else if (ratio <= 1.5) {
                efficiencyComponent = 90.0 - ((ratio - 1.0) * 40.0); // Moderate penalty
            } else {
                efficiencyComponent = 50.0; // Higher penalty for significant overrun
            }
        }

        // Complexity bonus/adjustment
        double complexityMultiplier = getComplexityMultiplier(taskComplexity);

        // Calculate weighted task score
        double taskScore = (qualityComponent * 0.4) + 
                          (timelinessComponent * 0.3) + 
                          (efficiencyComponent * 0.3);

        return taskScore * complexityMultiplier;
    }

    private double calculateQualityScore(Double averageQualityRating) {
        if (averageQualityRating == null) return 70.0;
        return averageQualityRating * 20.0; // 1-5 scale to 20-100 scale
    }

    private double calculateTimelinessScore(Double onTimeCompletionRate) {
        if (onTimeCompletionRate == null) return 70.0;
        return onTimeCompletionRate * 100.0; // 0-1 scale to 0-100 scale
    }

    private double calculateCompletionScore(int totalTasks, int completedTasks) {
        if (totalTasks == 0) return 70.0;
        double completionRate = (double) completedTasks / totalTasks;
        return completionRate * 100.0;
    }

    private double calculateEfficiencyScore(Double estimatedActualRatio) {
        if (estimatedActualRatio == null) return 70.0;
        
        // Perfect efficiency is 1.0 (actual = estimated)
        if (estimatedActualRatio <= 1.0) {
            return 100.0 - (estimatedActualRatio * 10.0); // Slight bonus for under-estimation
        } else if (estimatedActualRatio <= 1.5) {
            return 90.0 - ((estimatedActualRatio - 1.0) * 40.0); // Linear penalty
        } else {
            return 50.0; // Cap penalty at 50% for very poor estimation
        }
    }

    private double getComplexityMultiplier(String taskComplexity) {
        if (taskComplexity == null) return 1.0;
        
        return switch (taskComplexity.toLowerCase()) {
            case "low", "easy" -> 0.9;      // Slightly lower impact for easy tasks
            case "medium", "normal" -> 1.0;  // Standard impact
            case "high", "hard" -> 1.1;     // Slightly higher impact for complex tasks
            case "critical", "expert" -> 1.2; // Higher impact for critical tasks
            default -> 1.0;
        };
    }

    /**
     * Recalculate performance scores for all users (batch operation)
     */
    @Transactional
    public void recalculateAllPerformanceScores() {
        List<User> users = userRepository.findAll();
        
        for (User user : users) {
            try {
                calculateAndUpdatePerformanceScore(user.getId());
                Thread.sleep(100); // Small delay to avoid overwhelming the task service
            } catch (Exception e) {
                log.error("Failed to calculate performance score for user {}: {}", user.getId(), e.getMessage());
            }
        }
        
        log.info("Completed batch recalculation of performance scores for {} users", users.size());
    }

    /**
     * Get performance score details for a user
     */
    public Double getUserPerformanceScore(String userId) {
        return userRepository.findById(userId)
                .map(User::getPerformanceScore)
                .orElse(null);
    }

    /**
     * Get detailed performance metrics for a user
     */
    public PerformanceDetailsResponse getUserPerformanceDetails(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Get task metrics from task service
        TaskMetricsResponse taskMetrics = null;
        try {
            ApiResponse<TaskMetricsResponse> response = taskServiceClient.getUserTaskMetrics(userId);
            taskMetrics = response.getResult();
        } catch (Exception e) {
            log.error("Failed to fetch task metrics for user: {}", userId, e);
        }

        // Calculate performance categories and insights
        String performanceCategory = calculatePerformanceCategory(user.getPerformanceScore());
        String[] strengthAreas = identifyStrengthAreas(taskMetrics);
        String[] improvementAreas = identifyImprovementAreas(taskMetrics);

        return PerformanceDetailsResponse.builder()
                .userId(user.getId())
                .userName(user.getFirstName() + " " + user.getLastName())
                .userEmail(user.getEmail())
                .performanceScore(user.getPerformanceScore())
                .qualityScore(taskMetrics != null ? taskMetrics.getAverageQualityRating() : null)
                .timelinessScore(taskMetrics != null ? taskMetrics.getTimelinessScore() : null)
                .completionRate(taskMetrics != null ? taskMetrics.getCompletionRate() : null)
                .efficiencyScore(taskMetrics != null ? taskMetrics.getEfficiencyScore() : null)
                .totalTasksAssigned(taskMetrics != null ? taskMetrics.getTotalTasksAssigned() : 0)
                .totalTasksCompleted(taskMetrics != null ? taskMetrics.getTotalTasksCompleted() : 0)
                .totalTasksOnTime(taskMetrics != null ? taskMetrics.getTasksCompletedOnTime() : 0)
                .totalEstimatedHours(taskMetrics != null ? taskMetrics.getTotalEstimatedHours() : 0.0)
                .totalActualHours(taskMetrics != null ? taskMetrics.getTotalActualHours() : 0.0)
                .averageQualityRating(taskMetrics != null ? taskMetrics.getAverageQualityRating() : null)
                .lastPerformanceUpdate(user.getLastPerformanceUpdate())
                .lastCalculated(LocalDateTime.now())
                .performanceCategory(performanceCategory)
                .strengthAreas(strengthAreas)
                .improvementAreas(improvementAreas)
                .build();
    }

    private String calculatePerformanceCategory(Double score) {
        if (score == null) return "NOT_EVALUATED";
        if (score >= 90) return "EXCEPTIONAL";
        if (score >= 80) return "HIGH";
        if (score >= 70) return "GOOD";
        if (score >= 60) return "AVERAGE";
        if (score >= 50) return "BELOW_AVERAGE";
        return "POOR";
    }

    private String[] identifyStrengthAreas(TaskMetricsResponse metrics) {
        if (metrics == null) return new String[0];
        
        List<String> strengths = new ArrayList<>();
        if (metrics.getAverageQualityRating() != null && metrics.getAverageQualityRating() >= 4.0) {
            strengths.add("High Quality Work");
        }
        if (metrics.getTimelinessScore() != null && metrics.getTimelinessScore() >= 85.0) {
            strengths.add("Meeting Deadlines");
        }
        if (metrics.getCompletionRate() != null && metrics.getCompletionRate() >= 90.0) {
            strengths.add("Task Completion");
        }
        if (metrics.getEfficiencyScore() != null && metrics.getEfficiencyScore() >= 100.0) {
            strengths.add("Time Management");
        }
        return strengths.toArray(new String[0]);
    }

    private String[] identifyImprovementAreas(TaskMetricsResponse metrics) {
        if (metrics == null) return new String[0];
        
        List<String> improvements = new ArrayList<>();
        if (metrics.getAverageQualityRating() != null && metrics.getAverageQualityRating() < 3.5) {
            improvements.add("Work Quality");
        }
        if (metrics.getTimelinessScore() != null && metrics.getTimelinessScore() < 70.0) {
            improvements.add("Deadline Management");
        }
        if (metrics.getCompletionRate() != null && metrics.getCompletionRate() < 80.0) {
            improvements.add("Task Follow-through");
        }
        if (metrics.getEfficiencyScore() != null && metrics.getEfficiencyScore() < 80.0) {
            improvements.add("Time Efficiency");
        }
        return improvements.toArray(new String[0]);
    }
}