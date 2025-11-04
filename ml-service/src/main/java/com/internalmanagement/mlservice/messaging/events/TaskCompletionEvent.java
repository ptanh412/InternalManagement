package com.internalmanagement.mlservice.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Event representing task completion for ML training
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCompletionEvent {

    private String eventId;
    
    private String taskId;
    
    private String assignedUserId;
    
    private LocalDateTime completionDate;
    
    private LocalDateTime assignmentDate;
    
    private Double actualHours;
    
    private Double estimatedHours;
    
    private String taskTitle;
    
    private String priority;
    
    private String difficulty;
    
    private List<String> requiredSkills;
    
    private String departmentId;
    
    private String projectId;
    
    private Double qualityScore;
    
    private String completionStatus; // COMPLETED, CANCELLED, FAILED
    
    private String feedback;
    
    private LocalDateTime eventTimestamp;
    
    private String eventSource; // task-service, project-service, etc.

    // Calculated fields
    public Double getTimeEfficiency() {
        if (actualHours == null || estimatedHours == null || actualHours <= 0) {
            return null;
        }
        return estimatedHours / actualHours;
    }

    public boolean isCompletedSuccessfully() {
        return "COMPLETED".equals(completionStatus);
    }

    public boolean isOverdue() {
        if (actualHours == null || estimatedHours == null) {
            return false;
        }
        return actualHours > estimatedHours * 1.2; // 20% overtime threshold
    }
}