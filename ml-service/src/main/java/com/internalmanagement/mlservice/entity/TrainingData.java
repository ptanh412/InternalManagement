package com.internalmanagement.mlservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entity representing ML training data collected from various sources
 */
@Entity
@Table(name = "comprehensive_training_data")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrainingData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "task_id", nullable = false)
    private String taskId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "task_title")
    private String taskTitle;

    @Column(name = "priority")
    private String priority;

    @Column(name = "difficulty")
    private String difficulty;

    @Column(name = "estimated_hours")
    private Double estimatedHours;

    @Column(name = "actual_hours")
    private Double actualHours;

    @Column(name = "performance_score")
    private Double performanceScore;

    @Column(name = "assignment_date")
    private LocalDateTime assignmentDate;

    @Column(name = "completion_date")
    private LocalDateTime completionDate;

    @ElementCollection
    @CollectionTable(name = "training_data_required_skills", 
                     joinColumns = @JoinColumn(name = "training_data_id"))
    @Column(name = "skill_name")
    private List<String> requiredSkills;

    @ElementCollection
    @CollectionTable(name = "training_data_user_skill_levels", 
                     joinColumns = @JoinColumn(name = "training_data_id"))
    @Column(name = "skill_level")
    private List<String> userSkillLevels;

    @Column(name = "department_name")
    private String departmentName;

    @Column(name = "seniority_level")
    private String seniorityLevel;

    @Column(name = "utilization")
    private Double utilization;

    @Column(name = "capacity")
    private Double capacity;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "recommendation_type")
    private String recommendationType;

    @Column(name = "predicted_performance")
    private Double predictedPerformance;

    @Column(name = "actual_performance")
    private Double actualPerformance;

    @Column(name = "data_source")
    private String dataSource;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Computed fields for ML features
    public Double getSkillMatchRatio() {
        if (requiredSkills == null || requiredSkills.isEmpty()) {
            return 1.0;
        }
        
        // This would need to be computed with actual user skills
        // For now, return a default value
        return 0.5;
    }

    public Integer getPriorityScore() {
        if (priority == null) return 2;
        
        return switch (priority.toUpperCase()) {
            case "LOW" -> 1;
            case "MEDIUM" -> 2;
            case "HIGH" -> 3;
            case "CRITICAL" -> 4;
            default -> 2;
        };
    }

    public Integer getDifficultyScore() {
        if (difficulty == null) return 2;
        
        return switch (difficulty.toUpperCase()) {
            case "EASY" -> 1;
            case "MEDIUM" -> 2;
            case "HARD" -> 3;
            default -> 2;
        };
    }

    public Integer getSeniorityScore() {
        if (seniorityLevel == null) return 3;
        
        return switch (seniorityLevel.toUpperCase()) {
            case "INTERN" -> 1;
            case "JUNIOR" -> 2;
            case "MID_LEVEL" -> 3;
            case "SENIOR" -> 4;
            case "LEAD" -> 5;
            case "PRINCIPAL" -> 6;
            default -> 3;
        };
    }

    public Double getTimeEfficiency() {
        if (actualHours == null || estimatedHours == null || actualHours == 0) {
            return 1.0;
        }
        
        return estimatedHours / actualHours;
    }

    public Double getAvailableCapacity() {
        if (capacity == null || utilization == null) {
            return 20.0; // Default available capacity
        }
        
        return capacity * (1 - utilization);
    }
}