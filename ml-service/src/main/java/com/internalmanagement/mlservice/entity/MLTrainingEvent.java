package com.internalmanagement.mlservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entity for storing real-time ML training events from Kafka
 */
@Entity
@Table(name = "ml_training_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MLTrainingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id")
    private String taskId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "event_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private EventType eventType;

    @Column(name = "assignment_date")
    private LocalDateTime assignmentDate;

    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    @Column(name = "actual_hours")
    private Double actualHours;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Column(name = "quality_score")
    private Double qualityScore;

    @Column(name = "assignment_method")
    private String assignmentMethod;

    @Column(name = "prediction_confidence")
    private Double predictionConfidence;

    @Column(name = "processed", nullable = false)
    private Boolean processed = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public enum EventType {
        TASK_ASSIGNMENT, TASK_COMPLETION, USER_ACTIVITY, SKILL_UPDATE
    }

    // Helper methods
    public boolean isTaskCompletionEvent() {
        return EventType.TASK_COMPLETION.equals(eventType);
    }

    public boolean isTaskAssignmentEvent() {
        return EventType.TASK_ASSIGNMENT.equals(eventType);
    }

    public boolean hasValidTaskData() {
        return taskId != null && userId != null;
    }

    public Double calculatePerformanceScore() {
        if (actualHours == null || estimatedHours == null || actualHours <= 0) {
            return qualityScore != null ? qualityScore : 0.5;
        }

        double timeEfficiency = estimatedHours / actualHours;
        double baseScore = Math.min(timeEfficiency, 1.0) * 0.7;
        
        if (qualityScore != null) {
            baseScore += qualityScore * 0.3;
        }

        return Math.max(0.0, Math.min(1.0, baseScore));
    }
}