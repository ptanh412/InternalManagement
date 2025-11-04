package com.internalmanagement.mlservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for tracking ML prediction logs and feedback
 */
@Entity
@Table(name = "ml_prediction_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PredictionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "model_version")
    private String modelVersion;

    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore;

    @Column(name = "content_score")
    private Double contentScore;

    @Column(name = "collaborative_score")
    private Double collaborativeScore;

    @Column(name = "predicted_success")
    private Boolean predictedSuccess;

    @Column(name = "actual_success")
    private Boolean actualSuccess;

    @Column(name = "prediction_accuracy")
    private Double predictionAccuracy;

    @Column(name = "recommendation_rank")
    private Integer recommendationRank;

    @Column(name = "was_selected")
    private Boolean wasSelected;

    @Column(name = "prediction_date", nullable = false)
    private LocalDateTime predictionDate;

    @Column(name = "feedback_date")
    private LocalDateTime feedbackDate;

    @Column(name = "prediction_type")
    @Enumerated(EnumType.STRING)
    private PredictionType predictionType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum PredictionType {
        TASK_ASSIGNMENT, PERFORMANCE_PREDICTION, RECOMMENDATION
    }

    // Helper methods
    public boolean hasFeedback() {
        return feedbackDate != null && actualSuccess != null;
    }

    public boolean isPredictionAccurate() {
        return predictionAccuracy != null && predictionAccuracy >= 0.8;
    }

    public void calculateAccuracy() {
        if (predictedSuccess != null && actualSuccess != null) {
            this.predictionAccuracy = predictedSuccess.equals(actualSuccess) ? 1.0 : 0.0;
            this.feedbackDate = LocalDateTime.now();
        }
    }
}