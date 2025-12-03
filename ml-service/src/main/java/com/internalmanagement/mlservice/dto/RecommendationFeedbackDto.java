package com.internalmanagement.mlservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
