package com.mnp.project.controller;

import com.mnp.project.dto.response.ResourcePlanningResponse;
import com.mnp.project.service.ResourcePlanningService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projects/resources")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ResourcePlanningController {

    ResourcePlanningService resourcePlanningService;

    /**
     * Generate comprehensive resource plan for a specific project
     */
    @GetMapping("/planning/{projectId}")
    public ApiResponse<ResourcePlanningResponse> generateResourcePlan(@PathVariable String projectId) {
        log.info("Generating resource plan for project: {}", projectId);

        ResourcePlanningResponse plan = resourcePlanningService.generateResourcePlan(projectId);

        return ApiResponse.<ResourcePlanningResponse>builder()
                .result(plan)
                .message("Resource plan generated successfully")
                .build();
    }

    /**
     * Get resource planning overview for all projects
     */
    @GetMapping("/planning/overview")
    public ApiResponse<List<ResourcePlanningResponse>> getAllResourcePlans() {
        log.info("Generating resource planning overview for all projects");

        List<ResourcePlanningResponse> allPlans = resourcePlanningService.getAllResourcePlans();

        return ApiResponse.<List<ResourcePlanningResponse>>builder()
                .result(allPlans)
                .message("All resource plans overview generated successfully")
                .build();
    }

    /**
     * Get resource allocation summary across all projects
     */
    @GetMapping("/allocation/summary")
    public ApiResponse<ResourceAllocationSummary> getResourceAllocationSummary() {
        log.info("Generating resource allocation summary");

        List<ResourcePlanningResponse> allPlans = resourcePlanningService.getAllResourcePlans();
        ResourceAllocationSummary summary = createAllocationSummary(allPlans);

        return ApiResponse.<ResourceAllocationSummary>builder()
                .result(summary)
                .message("Resource allocation summary generated successfully")
                .build();
    }

    /**
     * Get skill gap analysis across the organization
     */
    @GetMapping("/skills/gap-analysis")
    public ApiResponse<SkillGapAnalysis> getSkillGapAnalysis() {
        log.info("Generating organization-wide skill gap analysis");

        List<ResourcePlanningResponse> allPlans = resourcePlanningService.getAllResourcePlans();
        SkillGapAnalysis analysis = performSkillGapAnalysis(allPlans);

        return ApiResponse.<SkillGapAnalysis>builder()
                .result(analysis)
                .message("Skill gap analysis generated successfully")
                .build();
    }

    /**
     * Get resource utilization metrics
     */
    @GetMapping("/utilization/metrics")
    public ApiResponse<ResourceUtilizationMetrics> getResourceUtilizationMetrics() {
        log.info("Generating resource utilization metrics");

        List<ResourcePlanningResponse> allPlans = resourcePlanningService.getAllResourcePlans();
        ResourceUtilizationMetrics metrics = calculateUtilizationMetrics(allPlans);

        return ApiResponse.<ResourceUtilizationMetrics>builder()
                .result(metrics)
                .message("Resource utilization metrics generated successfully")
                .build();
    }

    /**
     * Get budget optimization recommendations
     */
    @GetMapping("/budget/optimization/{projectId}")
    public ApiResponse<BudgetOptimizationReport> getBudgetOptimizationRecommendations(
            @PathVariable String projectId) {
        log.info("Generating budget optimization recommendations for project: {}", projectId);

        ResourcePlanningResponse plan = resourcePlanningService.generateResourcePlan(projectId);
        BudgetOptimizationReport report = generateBudgetOptimizationReport(plan);

        return ApiResponse.<BudgetOptimizationReport>builder()
                .result(report)
                .message("Budget optimization recommendations generated successfully")
                .build();
    }

    /**
     * Get capacity planning forecast
     */
    @GetMapping("/capacity/forecast")
    public ApiResponse<CapacityForecast> getCapacityForecast(
            @RequestParam(defaultValue = "6") int monthsAhead) {
        log.info("Generating capacity forecast for {} months ahead", monthsAhead);

        List<ResourcePlanningResponse> allPlans = resourcePlanningService.getAllResourcePlans();
        CapacityForecast forecast = generateCapacityForecast(allPlans, monthsAhead);

        return ApiResponse.<CapacityForecast>builder()
                .result(forecast)
                .message("Capacity forecast generated successfully")
                .build();
    }

    // Helper methods to create response objects
    private ResourceAllocationSummary createAllocationSummary(List<ResourcePlanningResponse> allPlans) {
        int totalAllocatedResources = allPlans.stream()
                .mapToInt(ResourcePlanningResponse::getAllocatedResources)
                .sum();

        int totalRequiredResources = allPlans.stream()
                .mapToInt(ResourcePlanningResponse::getTotalRequiredResources)
                .sum();

        double totalBudget = allPlans.stream()
                .mapToDouble(ResourcePlanningResponse::getTotalBudget)
                .sum();

        double allocatedBudget = allPlans.stream()
                .mapToDouble(ResourcePlanningResponse::getAllocatedBudget)
                .sum();

        return ResourceAllocationSummary.builder()
                .totalAllocatedResources(totalAllocatedResources)
                .totalRequiredResources(totalRequiredResources)
                .allocationPercentage((double) totalAllocatedResources / totalRequiredResources * 100)
                .totalBudget(totalBudget)
                .allocatedBudget(allocatedBudget)
                .budgetUtilization(allocatedBudget / totalBudget * 100)
                .activeProjects(allPlans.size())
                .overAllocatedResources(calculateOverAllocatedCount(allPlans))
                .build();
    }

    private SkillGapAnalysis performSkillGapAnalysis(List<ResourcePlanningResponse> allPlans) {
        Map<String, Integer> totalRequiredSkills = allPlans.stream()
                .flatMap(plan -> plan.getRequiredSkills().entrySet().stream())
                .collect(java.util.stream.Collectors.groupingBy(
                    Map.Entry::getKey,
                    java.util.stream.Collectors.summingInt(Map.Entry::getValue)
                ));

        Map<String, Integer> totalAvailableSkills = allPlans.stream()
                .flatMap(plan -> plan.getAvailableSkills().entrySet().stream())
                .collect(java.util.stream.Collectors.groupingBy(
                    Map.Entry::getKey,
                    java.util.stream.Collectors.summingInt(Map.Entry::getValue)
                ));

        List<String> criticalSkillGaps = totalRequiredSkills.entrySet().stream()
                .filter(entry -> totalAvailableSkills.getOrDefault(entry.getKey(), 0) < entry.getValue())
                .map(Map.Entry::getKey)
                .collect(java.util.stream.Collectors.toList());

        return SkillGapAnalysis.builder()
                .totalRequiredSkills(totalRequiredSkills)
                .totalAvailableSkills(totalAvailableSkills)
                .criticalSkillGaps(criticalSkillGaps)
                .gapSeverity(criticalSkillGaps.size() > 5 ? "HIGH" : criticalSkillGaps.size() > 2 ? "MEDIUM" : "LOW")
                .recommendedActions(generateSkillGapRecommendations(criticalSkillGaps))
                .build();
    }

    private ResourceUtilizationMetrics calculateUtilizationMetrics(List<ResourcePlanningResponse> allPlans) {
        double averageUtilization = allPlans.stream()
                .mapToDouble(ResourcePlanningResponse::getResourceUtilizationPercentage)
                .average().orElse(0.0);

        int overUtilizedProjects = (int) allPlans.stream()
                .filter(plan -> plan.getResourceUtilizationPercentage() > 90)
                .count();

        int underUtilizedProjects = (int) allPlans.stream()
                .filter(plan -> plan.getResourceUtilizationPercentage() < 60)
                .count();

        return ResourceUtilizationMetrics.builder()
                .averageUtilization(averageUtilization)
                .optimallyUtilizedProjects((int) allPlans.stream()
                    .filter(plan -> plan.getResourceUtilizationPercentage() >= 60 && plan.getResourceUtilizationPercentage() <= 90)
                    .count())
                .overUtilizedProjects(overUtilizedProjects)
                .underUtilizedProjects(underUtilizedProjects)
                .utilizationTrend("STABLE") // Would calculate from historical data
                .recommendedOptimizations(generateUtilizationRecommendations(overUtilizedProjects, underUtilizedProjects))
                .build();
    }

    private BudgetOptimizationReport generateBudgetOptimizationReport(ResourcePlanningResponse plan) {
        double potentialSavings = plan.getTotalBudget() * 0.15; // Assume 15% potential savings

        return BudgetOptimizationReport.builder()
                .projectId(plan.getProjectId())
                .currentBudget(plan.getTotalBudget())
                .allocatedBudget(plan.getAllocatedBudget())
                .remainingBudget(plan.getRemainingBudget())
                .potentialSavings(potentialSavings)
                .optimizationOpportunities(generateOptimizationOpportunities(plan))
                .riskLevel(plan.getOverallRiskLevel())
                .recommendations(plan.getRecommendations())
                .build();
    }

    private CapacityForecast generateCapacityForecast(List<ResourcePlanningResponse> allPlans, int monthsAhead) {
        // Simplified capacity calculation - in real implementation, would use historical data and ML
        int currentCapacity = allPlans.stream().mapToInt(ResourcePlanningResponse::getAllocatedResources).sum();
        int projectedDemand = (int) (currentCapacity * 1.2); // 20% growth assumption

        return CapacityForecast.builder()
                .forecastPeriodMonths(monthsAhead)
                .currentCapacity(currentCapacity)
                .projectedDemand(projectedDemand)
                .capacityGap(projectedDemand - currentCapacity)
                .recommendedActions(generateCapacityRecommendations(projectedDemand - currentCapacity))
                .confidenceLevel("MEDIUM") // Based on data quality and historical accuracy
                .build();
    }

    // Additional helper methods
    private int calculateOverAllocatedCount(List<ResourcePlanningResponse> allPlans) {
        return (int) allPlans.stream()
                .flatMap(plan -> plan.getHumanResources().stream())
                .filter(resource -> resource.getUtilizationRate() > 100)
                .count();
    }

    private List<String> generateSkillGapRecommendations(List<String> criticalGaps) {
        return criticalGaps.stream()
                .map(skill -> "Consider hiring or training for: " + skill)
                .collect(java.util.stream.Collectors.toList());
    }

    private List<String> generateUtilizationRecommendations(int overUtilized, int underUtilized) {
        List<String> recommendations = new java.util.ArrayList<>();
        if (overUtilized > 0) {
            recommendations.add("Redistribute workload from over-utilized projects");
        }
        if (underUtilized > 0) {
            recommendations.add("Consider resource reallocation from under-utilized projects");
        }
        return recommendations;
    }

    private List<String> generateOptimizationOpportunities(ResourcePlanningResponse plan) {
        List<String> opportunities = new java.util.ArrayList<>();
        opportunities.add("Consider offshore development for non-critical tasks");
        opportunities.add("Evaluate contractor vs full-time employee costs");
        opportunities.add("Optimize software license utilization");
        return opportunities;
    }

    private List<String> generateCapacityRecommendations(int capacityGap) {
        List<String> recommendations = new java.util.ArrayList<>();
        if (capacityGap > 0) {
            recommendations.add("Plan for hiring " + capacityGap + " additional resources");
            recommendations.add("Consider contractor augmentation for peak periods");
            recommendations.add("Evaluate automation opportunities to increase efficiency");
        }
        return recommendations;
    }

    // Inner classes for response objects
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ResourceAllocationSummary {
        private Integer totalAllocatedResources;
        private Integer totalRequiredResources;
        private Double allocationPercentage;
        private Double totalBudget;
        private Double allocatedBudget;
        private Double budgetUtilization;
        private Integer activeProjects;
        private Integer overAllocatedResources;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class SkillGapAnalysis {
        private Map<String, Integer> totalRequiredSkills;
        private Map<String, Integer> totalAvailableSkills;
        private List<String> criticalSkillGaps;
        private String gapSeverity;
        private List<String> recommendedActions;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ResourceUtilizationMetrics {
        private Double averageUtilization;
        private Integer optimallyUtilizedProjects;
        private Integer overUtilizedProjects;
        private Integer underUtilizedProjects;
        private String utilizationTrend;
        private List<String> recommendedOptimizations;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class BudgetOptimizationReport {
        private String projectId;
        private Double currentBudget;
        private Double allocatedBudget;
        private Double remainingBudget;
        private Double potentialSavings;
        private List<String> optimizationOpportunities;
        private String riskLevel;
        private List<ResourcePlanningResponse.ResourceRecommendation> recommendations;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CapacityForecast {
        private Integer forecastPeriodMonths;
        private Integer currentCapacity;
        private Integer projectedDemand;
        private Integer capacityGap;
        private List<String> recommendedActions;
        private String confidenceLevel;
    }

    // Simple ApiResponse class
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ApiResponse<T> {
        private T result;
        private String message;
        private Integer code;
    }
}
