package com.mnp.ai.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateFeatures {
    // Identifiers
    private String userId;
    private String userName;
    private String departmentName;

    // Skills
    private List<String> userSkills;
    private List<String> userSkillLevels;  // Proficiency levels for each skill
    private List<String> requiredSkills;

    // Base matching
    private double baseSkillMatchScore;

    // AI-engineered features
    private double relatedSkillsScore;
    private double learningPotentialScore;
    private double domainExperienceBonus;
    private double techStackCohesionBonus;
    private double certificationBonus;

    // Candidate attributes
    private String seniorityLevel;  // Changed from int to String (INTERN, JUNIOR, MID_LEVEL, etc.)
    private double yearsExperience;
    private double currentUtilization;
    private double availableCapacity;
    private double averageActualHours;
    private double performanceScore;
    private double taskSuccessRate;

    // Task attributes
    private String taskPriority;
    private String taskDifficulty;
    private double estimatedHours;
}

