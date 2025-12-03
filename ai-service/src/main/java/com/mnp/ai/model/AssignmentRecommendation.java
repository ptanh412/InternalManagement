package com.mnp.ai.model;

import java.util.List;
import java.util.Map;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignmentRecommendation {
    String userId;
    String taskId;
    Double overallScore; // Final recommendation score (0-1)

    // Individual algorithm scores (only hybrid-related ones)
    Double contentBasedScore;
    Double collaborativeFilteringScore;
    Double hybridScore;

    // Individual criteria scores
    Double skillMatchScore;
    Double workloadScore;
    Double performanceScore;
    Double availabilityScore;
    Double collaborationScore;

    String recommendationReason;
    Integer rank; // Ranking among all candidates

    // Gemini AI integration fields
    String geminiReasoning; // Detailed AI reasoning from Gemini
    Boolean isTeamLead; // Whether this candidate is identified as team lead/senior
    Double geminiScore; // Score provided by Gemini AI

    // Enhanced skill necessity information
    Map<String, String> skillNecessityReasons; // skill -> why this skill is necessary for the task
    List<String> matchedSkills; // skills that the candidate has and are required for the task
    List<String> missingSkills; // required skills that the candidate lacks
    Map<String, Double> skillGaps; // skill -> gap score (required level - candidate level)
    String skillMatchSummary; // Overall summary of skill compatibility

    // Additional skill analysis
    List<String> bonusSkills; // extra skills the candidate has that could be beneficial
    String skillDevelopmentOpportunity; // areas where this assignment could help candidate grow
}
