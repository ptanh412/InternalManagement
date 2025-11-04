package com.internalmanagement.mlservice.messaging.events;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Event representing user profile or skill updates for ML training
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileUpdateEvent {

    private String eventId;
    
    private String userId;
    
    private String email;
    
    private String eventType; // SKILL_UPDATE, DEPARTMENT_CHANGE, SENIORITY_CHANGE, PROFILE_UPDATE
    
    // Profile information
    private String departmentName;
    
    private String seniorityLevel;
    
    private List<String> skills;
    
    private List<String> skillLevels;
    
    private Double yearsExperience;
    
    private Double utilization;
    
    private Double capacity;
    
    // Change tracking
    private Map<String, Object> previousValues;
    
    private Map<String, Object> newValues;
    
    private String changeReason;
    
    private LocalDateTime eventTimestamp;
    
    private String eventSource;

    // Helper methods
    public boolean isSkillUpdate() {
        return "SKILL_UPDATE".equals(eventType);
    }

    public boolean isMajorChange() {
        return "DEPARTMENT_CHANGE".equals(eventType) || "SENIORITY_CHANGE".equals(eventType);
    }

    public List<String> getAddedSkills() {
        // Implementation would compare previous and new skill lists
        return skills; // Simplified for now
    }

    public List<String> getRemovedSkills() {
        // Implementation would compare previous and new skill lists
        return List.of(); // Simplified for now
    }
}