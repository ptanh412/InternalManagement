package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResourcePlanningResponse {
    String planId;
    String projectId;
    String projectName;

    // Resource Overview
    Integer totalRequiredResources;
    Integer allocatedResources;
    Integer availableResources;
    Double resourceUtilizationPercentage;

    // Budget Planning
    Double totalBudget;
    Double allocatedBudget;
    Double remainingBudget;
    Map<String, Double> budgetByCategory; // PERSONNEL, EQUIPMENT, SOFTWARE, etc.

    // Human Resources
    List<ResourceAllocation> humanResources;
    Map<String, Integer> requiredSkills; // skill -> count needed
    Map<String, Integer> availableSkills; // skill -> count available
    List<String> skillGaps;

    // Timeline Resource Distribution
    List<MonthlyResourcePlan> monthlyPlans;

    // Equipment and Infrastructure
    List<EquipmentResource> equipmentNeeds;
    List<SoftwareLicense> softwareRequirements;

    // Risk Analysis
    List<ResourceRisk> resourceRisks;
    String overallRiskLevel;

    // Recommendations
    List<ResourceRecommendation> recommendations;

    // Comparison and Benchmarks
    Double industryAverageResourceCost;
    String efficiencyRating; // EXCELLENT, GOOD, AVERAGE, POOR

    LocalDateTime planCreatedAt;
    LocalDateTime lastUpdated;
    String planStatus; // DRAFT, APPROVED, IN_EXECUTION, COMPLETED
    String createdBy;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceAllocation {
        String userId;
        String employeeName;
        String role;
        String department;
        String skillLevel; // JUNIOR, INTERMEDIATE, SENIOR, EXPERT
        Double hourlyRate;
        Integer allocatedHours;
        Double allocationPercentage; // 0-100%
        LocalDate startDate;
        LocalDate endDate;
        String status; // ALLOCATED, TENTATIVE, CONFIRMED, RELEASED
        List<String> primarySkills;
        Double utilizationRate; // current utilization
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyResourcePlan {
        String month;
        Integer year;
        Integer plannedResources;
        Integer actualResources;
        Double plannedBudget;
        Double actualSpend;
        List<String> keyMilestones;
        String resourcePressure; // LOW, MEDIUM, HIGH, CRITICAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EquipmentResource {
        String equipmentId;
        String name;
        String category; // HARDWARE, SOFTWARE, INFRASTRUCTURE
        Integer quantity;
        Double unitCost;
        Double totalCost;
        String vendor;
        LocalDate requiredDate;
        String status; // IDENTIFIED, QUOTED, ORDERED, DELIVERED
        String priority; // LOW, MEDIUM, HIGH, CRITICAL
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SoftwareLicense {
        String softwareId;
        String name;
        String licenseType; // PERPETUAL, SUBSCRIPTION, CONCURRENT
        Integer licenseCount;
        Double costPerLicense;
        Double totalCost;
        LocalDate startDate;
        LocalDate expiryDate;
        String vendor;
        List<String> assignedUsers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceRisk {
        String riskId;
        String description;
        String category; // AVAILABILITY, COST, SKILL, EQUIPMENT
        String severity; // LOW, MEDIUM, HIGH, CRITICAL
        String probability; // LOW, MEDIUM, HIGH
        String impact;
        String mitigation;
        String owner;
        LocalDate identifiedDate;
        String status; // IDENTIFIED, MITIGATING, RESOLVED, ACCEPTED
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResourceRecommendation {
        String recommendationId;
        String type; // HIRING, TRAINING, EQUIPMENT, OUTSOURCING
        String description;
        String rationale;
        Double estimatedCost;
        Double expectedBenefit;
        String priority; // LOW, MEDIUM, HIGH, CRITICAL
        String timeframe; // IMMEDIATE, SHORT_TERM, LONG_TERM
        List<String> dependencies;
        String status; // PROPOSED, UNDER_REVIEW, APPROVED, REJECTED, IMPLEMENTED
    }
}
