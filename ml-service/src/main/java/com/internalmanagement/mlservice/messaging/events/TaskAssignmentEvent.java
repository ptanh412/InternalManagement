package com.internalmanagement.mlservice.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Event representing task assignment for ML training
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentEvent {

    private String eventId;
    
    private String taskId;
    
    private String userId;
    
    private LocalDateTime assignmentDate;
    
    private String assignmentMethod; // MANUAL, RECOMMENDATION, AUTO
    
    private String taskTitle;
    
    private String priority;
    
    private String difficulty;
    
    private Double estimatedHours;
    
    private List<String> requiredSkills;
    
    private String departmentId;
    
    private String projectId;
    
    // ML-related fields
    private Double predictionConfidence;
    
    private Integer recommendationRank;
    
    private String modelVersion;
    
    private boolean wasRecommendedByML;
    
    private String assignedBy; // User ID of person who made assignment
    
    private String reason;
    
    private LocalDateTime eventTimestamp;
    
    private String eventSource;

    // Helper methods
    public boolean isMLRecommended() {
        return wasRecommendedByML || "RECOMMENDATION".equals(assignmentMethod);
    }

    public boolean isHighConfidence() {
        return predictionConfidence != null && predictionConfidence >= 0.8;
    }

    public boolean isTopRecommendation() {
        return recommendationRank != null && recommendationRank <= 3;
    }
}