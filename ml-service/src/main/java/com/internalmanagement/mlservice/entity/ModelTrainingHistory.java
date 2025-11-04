package com.internalmanagement.mlservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Entity representing ML model training history and metadata
 */
@Entity
@Table(name = "model_training_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ModelTrainingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "training_date", nullable = false)
    private LocalDateTime trainingDate;

    @Column(name = "model_version", nullable = false)
    private String modelVersion;

    @Column(name = "accuracy")
    private Double accuracy;

    @Column(name = "f1_score")
    private Double f1Score;

    @Column(name = "precision_score")
    private Double precisionScore;

    @Column(name = "recall_score")
    private Double recallScore;

    @Column(name = "training_records")
    private Integer trainingRecords;

    @Column(name = "accuracy_improvement")
    private Double accuracyImprovement;

    @Column(name = "f1_improvement")
    private Double f1Improvement;

    @Column(name = "deployment_status")
    @Enumerated(EnumType.STRING)
    private DeploymentStatus deploymentStatus;

    @Column(name = "training_duration_minutes")
    private Double trainingDurationMinutes;

    @Column(name = "error_message")
    private String errorMessage;

    // Store additional metrics as JSON
    @ElementCollection
    @CollectionTable(name = "training_additional_metrics",
                     joinColumns = @JoinColumn(name = "training_history_id"))
    @MapKeyColumn(name = "metric_name")
    @Column(name = "metric_value")
    private Map<String, Double> additionalMetrics;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum DeploymentStatus {
        DEPLOYED, FAILED, SKIPPED, TESTING
    }

    // Helper methods for status checks
    public boolean isSuccessfulDeployment() {
        return DeploymentStatus.DEPLOYED.equals(deploymentStatus);
    }

    public boolean isTrainingFailed() {
        return DeploymentStatus.FAILED.equals(deploymentStatus);
    }

    public Double getRocAucScore() {
        return additionalMetrics != null ? additionalMetrics.get("roc_auc") : null;
    }

    public Double getCvF1Mean() {
        return additionalMetrics != null ? additionalMetrics.get("cv_f1_mean") : null;
    }

    public Double getCvF1Std() {
        return additionalMetrics != null ? additionalMetrics.get("cv_f1_std") : null;
    }
}