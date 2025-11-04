package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * DTO for performance prediction requests
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformancePredictionRequestDto {

    @NotBlank(message = "Task ID is required")
    private String taskId;

    @NotBlank(message = "User ID is required")
    private String userId;

    private TaskDetailsDto taskDetails;
    
    private UserProfileDto userProfile;
}

/**
 * DTO for performance prediction response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformancePredictionDto {

    private boolean success;
    
    private String message;

    private String taskId;
    
    private String userId;
    
    @Min(0)
    @Max(1)
    private Double predictedPerformanceScore;
    
    private Double confidenceScore;
    
    private Double estimatedCompletionTimeHours;
    
    private String riskLevel; // LOW, MEDIUM, HIGH
    
    private List<String> riskFactors;
    
    private List<String> successFactors;
    
    private LocalDateTime predictionDate;
    
    private String modelVersion;
}

/**
 * DTO for recommendation feedback
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationFeedbackDto {

    @NotBlank(message = "Task ID is required")
    private String taskId;

    @NotBlank(message = "User ID is required")
    private String userId;
    
    private Boolean wasRecommended;
    
    private Boolean wasSelected;
    
    private Boolean taskCompleted;
    
    private Double actualPerformanceScore;
    
    private Double actualCompletionTimeHours;
    
    private Integer satisfactionRating; // 1-5
    
    private String feedback;
    
    private LocalDateTime submissionDate;
}

/**
 * DTO for feedback response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponseDto {

    private boolean success;
    
    private String message;
    
    private String feedbackId;
}

/**
 * DTO for recommendation explanations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationExplanationDto {

    private boolean success;
    
    private String message;

    private String taskId;
    
    private String userId;
    
    private Double overallScore;
    
    private String explanation;
    
    private Map<String, Double> factorScores;
    
    private List<String> strengthReasons;
    
    private List<String> weaknessReasons;
    
    private List<SimilarCaseDto> similarCases;
}

/**
 * DTO for similar cases in explanations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarCaseDto {

    private String taskId;
    
    private String taskTitle;
    
    private Double similarity;
    
    private Double performanceScore;
    
    private String outcome;
}

/**
 * DTO for similar tasks
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimilarTaskDto {

    private String taskId;
    
    private String title;
    
    private String priority;
    
    private String difficulty;
    
    private List<String> skills;
    
    private Double similarity;
    
    private Double averagePerformance;
}

/**
 * DTO for user recommendation history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRecommendationHistoryDto {

    private String userId;
    
    private int totalRecommendations;
    
    private int selectedRecommendations;
    
    private Double averagePerformance;
    
    private List<RecommendationHistoryItemDto> history;
}

/**
 * Individual recommendation history item
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationHistoryItemDto {

    private String taskId;
    
    private String taskTitle;
    
    private LocalDateTime recommendationDate;
    
    private Double confidenceScore;
    
    private Integer rank;
    
    private Boolean wasSelected;
    
    private Double actualPerformance;
    
    private String outcome;
}

/**
 * DTO for model status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelStatusDto {

    private boolean available;
    
    private String message;
    
    private String modelVersion;
    
    private LocalDateTime lastTraining;
    
    private Double healthScore;
    
    private String healthStatus;
    
    private Map<String, Object> metrics;
}