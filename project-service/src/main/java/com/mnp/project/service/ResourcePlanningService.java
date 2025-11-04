package com.mnp.project.service;

import com.mnp.project.dto.response.ResourcePlanningResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ResourcePlanningService {

    RestTemplate restTemplate;

    private static final String IDENTITY_SERVICE_URL = "http://localhost:8888/api/v1/identity/users";
    private static final String WORKLOAD_SERVICE_URL = "http://localhost:8888/api/v1/workloads";

    public ResourcePlanningResponse generateResourcePlan(String projectId) {
        log.info("Generating resource plan for project: {}", projectId);

        try {
            // Fetch project requirements
            ProjectRequirements requirements = fetchProjectRequirements(projectId);

            // Fetch available resources
            List<AvailableResource> availableResources = fetchAvailableResources();

            // Calculate resource allocations
            ResourceAllocationResult allocationResult = calculateResourceAllocations(requirements, availableResources);

            // Generate monthly resource plans
            List<ResourcePlanningResponse.MonthlyResourcePlan> monthlyPlans =
                generateMonthlyResourcePlans(projectId, requirements);

            // Identify resource risks
            List<ResourcePlanningResponse.ResourceRisk> risks =
                identifyResourceRisks(requirements, allocationResult);

            // Generate recommendations
            List<ResourcePlanningResponse.ResourceRecommendation> recommendations =
                generateResourceRecommendations(requirements, allocationResult, risks);

            return ResourcePlanningResponse.builder()
                .planId(UUID.randomUUID().toString())
                .projectId(projectId)
                .projectName(requirements.projectName)
                .totalRequiredResources(requirements.requiredHeadcount)
                .allocatedResources(allocationResult.allocatedCount)
                .availableResources(availableResources.size())
                .resourceUtilizationPercentage(calculateUtilizationPercentage(allocationResult))
                .totalBudget(requirements.totalBudget)
                .allocatedBudget(allocationResult.allocatedBudget)
                .remainingBudget(requirements.totalBudget - allocationResult.allocatedBudget)
                .budgetByCategory(generateBudgetByCategory(requirements))
                .humanResources(allocationResult.allocations)
                .requiredSkills(requirements.requiredSkills)
                .availableSkills(calculateAvailableSkills(availableResources))
                .skillGaps(identifySkillGaps(requirements.requiredSkills, availableResources))
                .monthlyPlans(monthlyPlans)
                .equipmentNeeds(generateEquipmentNeeds(requirements))
                .softwareRequirements(generateSoftwareRequirements(requirements))
                .resourceRisks(risks)
                .overallRiskLevel(calculateOverallRiskLevel(risks))
                .recommendations(recommendations)
                .industryAverageResourceCost(calculateIndustryAverage(requirements))
                .efficiencyRating(calculateEfficiencyRating(allocationResult, requirements))
                .planCreatedAt(LocalDateTime.now())
                .lastUpdated(LocalDateTime.now())
                .planStatus("DRAFT")
                .createdBy("System")
                .build();

        } catch (Exception e) {
            log.error("Failed to generate resource plan for project: {}", projectId, e);
            throw new RuntimeException("Failed to generate resource plan: " + e.getMessage());
        }
    }

    public List<ResourcePlanningResponse> getAllResourcePlans() {
        log.info("Generating resource plans for all active projects");

        try {
            // Fetch all active project IDs
            List<String> projectIds = fetchActiveProjectIds();

            return projectIds.stream()
                .map(this::generateResourcePlan)
                .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to generate all resource plans", e);
            throw new RuntimeException("Failed to generate all resource plans: " + e.getMessage());
        }
    }

    private ProjectRequirements fetchProjectRequirements(String projectId) {
        // In real implementation, fetch from project repository
        return ProjectRequirements.builder()
            .projectId(projectId)
            .projectName("Sample Project " + projectId)
            .requiredHeadcount(8)
            .totalBudget(250000.0)
            .startDate(LocalDate.now())
            .endDate(LocalDate.now().plusMonths(6))
            .requiredSkills(Map.of(
                "Java Developer", 3,
                "Frontend Developer", 2,
                "DevOps Engineer", 1,
                "QA Engineer", 2
            ))
            .priority("HIGH")
            .build();
    }

    @SuppressWarnings("unchecked")
    private List<AvailableResource> fetchAvailableResources() {
        try {
            String url = WORKLOAD_SERVICE_URL + "/available-resources";
            List<Map<String, Object>> resourceData = restTemplate.getForObject(url, List.class);

            return resourceData.stream().map(data -> AvailableResource.builder()
                .userId((String) data.get("userId"))
                .name((String) data.get("name"))
                .role((String) data.get("role"))
                .department((String) data.get("department"))
                .skillLevel((String) data.get("skillLevel"))
                .hourlyRate(((Number) data.getOrDefault("hourlyRate", 50.0)).doubleValue())
                .availabilityPercentage(((Number) data.getOrDefault("availability", 100.0)).doubleValue())
                .skills((List<String>) data.getOrDefault("skills", new ArrayList<>()))
                .currentUtilization(((Number) data.getOrDefault("utilization", 0.0)).doubleValue())
                .build()).collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Failed to fetch available resources, generating sample data");
            return generateSampleAvailableResources();
        }
    }

    private ResourceAllocationResult calculateResourceAllocations(
            ProjectRequirements requirements, List<AvailableResource> availableResources) {

        List<ResourcePlanningResponse.ResourceAllocation> allocations = new ArrayList<>();
        double totalAllocatedBudget = 0.0;
        int allocatedCount = 0;

        // Sort resources by availability and skill match
        List<AvailableResource> sortedResources = availableResources.stream()
            .filter(r -> r.availabilityPercentage > 20) // At least 20% available
            .sorted((r1, r2) -> {
                // Prioritize by skill match and availability
                int skillMatch1 = calculateSkillMatch(r1, requirements.requiredSkills);
                int skillMatch2 = calculateSkillMatch(r2, requirements.requiredSkills);
                if (skillMatch1 != skillMatch2) return Integer.compare(skillMatch2, skillMatch1);
                return Double.compare(r2.availabilityPercentage, r1.availabilityPercentage);
            })
            .collect(Collectors.toList());

        // Allocate resources based on project needs
        Map<String, Integer> remainingSkillNeeds = new HashMap<>(requirements.requiredSkills);

        for (AvailableResource resource : sortedResources) {
            if (allocatedCount >= requirements.requiredHeadcount) break;

            // Check if resource has needed skills
            String matchedSkill = findBestSkillMatch(resource, remainingSkillNeeds);
            if (matchedSkill != null) {
                double allocationPercentage = Math.min(resource.availabilityPercentage, 100.0);
                int allocatedHours = (int) (160 * allocationPercentage / 100); // Monthly hours
                double monthlyCost = allocatedHours * resource.hourlyRate;

                allocations.add(ResourcePlanningResponse.ResourceAllocation.builder()
                    .userId(resource.userId)
                    .employeeName(resource.name)
                    .role(resource.role)
                    .department(resource.department)
                    .skillLevel(resource.skillLevel)
                    .hourlyRate(resource.hourlyRate)
                    .allocatedHours(allocatedHours)
                    .allocationPercentage(allocationPercentage)
                    .startDate(requirements.startDate)
                    .endDate(requirements.endDate)
                    .status("TENTATIVE")
                    .primarySkills(resource.skills)
                    .utilizationRate(resource.currentUtilization + allocationPercentage)
                    .build());

                totalAllocatedBudget += monthlyCost * 6; // 6 months project
                allocatedCount++;

                // Update remaining skill needs
                remainingSkillNeeds.put(matchedSkill, remainingSkillNeeds.get(matchedSkill) - 1);
                if (remainingSkillNeeds.get(matchedSkill) <= 0) {
                    remainingSkillNeeds.remove(matchedSkill);
                }
            }
        }

        return ResourceAllocationResult.builder()
            .allocations(allocations)
            .allocatedBudget(totalAllocatedBudget)
            .allocatedCount(allocatedCount)
            .unmetSkillRequirements(remainingSkillNeeds)
            .build();
    }

    private List<ResourcePlanningResponse.MonthlyResourcePlan> generateMonthlyResourcePlans(
            String projectId, ProjectRequirements requirements) {

        List<ResourcePlanningResponse.MonthlyResourcePlan> monthlyPlans = new ArrayList<>();
        YearMonth current = YearMonth.from(requirements.startDate);
        YearMonth end = YearMonth.from(requirements.endDate);

        while (!current.isAfter(end)) {
            // Calculate resource needs per month (can vary based on project phases)
            int monthIndex = (int) current.until(end).toTotalMonths();
            int plannedResources = calculateMonthlyResourceNeed(monthIndex, requirements);
            double monthlyBudget = requirements.totalBudget / 6; // Distribute evenly

            monthlyPlans.add(ResourcePlanningResponse.MonthlyResourcePlan.builder()
                .month(current.getMonth().name())
                .year(current.getYear())
                .plannedResources(plannedResources)
                .actualResources(0) // Will be updated during execution
                .plannedBudget(monthlyBudget)
                .actualSpend(0.0) // Will be updated during execution
                .keyMilestones(getMonthlyMilestones(monthIndex))
                .resourcePressure(calculateResourcePressure(monthIndex, plannedResources))
                .build());

            current = current.plusMonths(1);
        }

        return monthlyPlans;
    }

    private List<ResourcePlanningResponse.ResourceRisk> identifyResourceRisks(
            ProjectRequirements requirements, ResourceAllocationResult allocationResult) {

        List<ResourcePlanningResponse.ResourceRisk> risks = new ArrayList<>();

        // Skill gap risk
        if (!allocationResult.unmetSkillRequirements.isEmpty()) {
            risks.add(ResourcePlanningResponse.ResourceRisk.builder()
                .riskId("RISK-SKILL-GAP")
                .description("Critical skills not available: " + allocationResult.unmetSkillRequirements.keySet())
                .category("SKILL")
                .severity("HIGH")
                .probability("HIGH")
                .impact("May delay project delivery by 2-4 weeks")
                .mitigation("Hire contractors or train existing team members")
                .owner("HR Manager")
                .identifiedDate(LocalDate.now())
                .status("IDENTIFIED")
                .build());
        }

        // Budget risk
        if (allocationResult.allocatedBudget > requirements.totalBudget * 0.9) {
            risks.add(ResourcePlanningResponse.ResourceRisk.builder()
                .riskId("RISK-BUDGET-OVERRUN")
                .description("Resource costs exceeding 90% of budget")
                .category("COST")
                .severity("MEDIUM")
                .probability("MEDIUM")
                .impact("Project may exceed budget by 10-15%")
                .mitigation("Negotiate rates or reduce scope")
                .owner("Project Manager")
                .identifiedDate(LocalDate.now())
                .status("IDENTIFIED")
                .build());
        }

        // Resource availability risk
        long overUtilizedResources = allocationResult.allocations.stream()
            .filter(a -> a.getUtilizationRate() > 100)
            .count();

        if (overUtilizedResources > 0) {
            risks.add(ResourcePlanningResponse.ResourceRisk.builder()
                .riskId("RISK-OVER-UTILIZATION")
                .description(overUtilizedResources + " resources over-allocated")
                .category("AVAILABILITY")
                .severity("HIGH")
                .probability("HIGH")
                .impact("Risk of burnout and quality issues")
                .mitigation("Redistribute workload or hire additional resources")
                .owner("Team Lead")
                .identifiedDate(LocalDate.now())
                .status("IDENTIFIED")
                .build());
        }

        return risks;
    }

    private List<ResourcePlanningResponse.ResourceRecommendation> generateResourceRecommendations(
            ProjectRequirements requirements, ResourceAllocationResult allocationResult,
            List<ResourcePlanningResponse.ResourceRisk> risks) {

        List<ResourcePlanningResponse.ResourceRecommendation> recommendations = new ArrayList<>();

        // Hiring recommendations for skill gaps
        if (!allocationResult.unmetSkillRequirements.isEmpty()) {
            allocationResult.unmetSkillRequirements.forEach((skill, count) -> {
                recommendations.add(ResourcePlanningResponse.ResourceRecommendation.builder()
                    .recommendationId("REC-HIRE-" + skill.replace(" ", "_"))
                    .type("HIRING")
                    .description("Hire " + count + " " + skill + "(s)")
                    .rationale("Critical skill gap identified in project requirements")
                    .estimatedCost(count * 80000.0) // Estimated annual salary
                    .expectedBenefit(150000.0) // Value of on-time delivery
                    .priority("HIGH")
                    .timeframe("IMMEDIATE")
                    .dependencies(Arrays.asList("Budget approval", "HR recruitment"))
                    .status("PROPOSED")
                    .build());
            });
        }

        // Training recommendations
        recommendations.add(ResourcePlanningResponse.ResourceRecommendation.builder()
            .recommendationId("REC-TRAINING-UPSKILL")
            .type("TRAINING")
            .description("Upskill existing team members in required technologies")
            .rationale("More cost-effective than hiring for some skill gaps")
            .estimatedCost(15000.0)
            .expectedBenefit(50000.0)
            .priority("MEDIUM")
            .timeframe("SHORT_TERM")
            .dependencies(Arrays.asList("Training provider selection", "Team availability"))
            .status("PROPOSED")
            .build());

        return recommendations;
    }

    // Helper methods
    private double calculateUtilizationPercentage(ResourceAllocationResult result) {
        return result.allocations.stream()
            .mapToDouble(ResourcePlanningResponse.ResourceAllocation::getAllocationPercentage)
            .average()
            .orElse(0.0);
    }

    private Map<String, Double> generateBudgetByCategory(ProjectRequirements requirements) {
        Map<String, Double> budgetByCategory = new HashMap<>();
        budgetByCategory.put("PERSONNEL", requirements.totalBudget * 0.70);
        budgetByCategory.put("EQUIPMENT", requirements.totalBudget * 0.15);
        budgetByCategory.put("SOFTWARE", requirements.totalBudget * 0.10);
        budgetByCategory.put("MISCELLANEOUS", requirements.totalBudget * 0.05);
        return budgetByCategory;
    }

    private Map<String, Integer> calculateAvailableSkills(List<AvailableResource> resources) {
        return resources.stream()
            .flatMap(r -> r.skills.stream())
            .collect(Collectors.groupingBy(
                skill -> skill,
                Collectors.summingInt(skill -> 1)
            ));
    }

    private List<String> identifySkillGaps(Map<String, Integer> required, List<AvailableResource> available) {
        Map<String, Integer> availableSkills = calculateAvailableSkills(available);

        return required.entrySet().stream()
            .filter(entry -> availableSkills.getOrDefault(entry.getKey(), 0) < entry.getValue())
            .map(Map.Entry::getKey)
            .collect(Collectors.toList());
    }

    private int calculateSkillMatch(AvailableResource resource, Map<String, Integer> requiredSkills) {
        return (int) resource.skills.stream()
            .filter(requiredSkills::containsKey)
            .count();
    }

    private String findBestSkillMatch(AvailableResource resource, Map<String, Integer> remainingNeeds) {
        return resource.skills.stream()
            .filter(skill -> remainingNeeds.containsKey(skill) && remainingNeeds.get(skill) > 0)
            .findFirst()
            .orElse(null);
    }

    private List<AvailableResource> generateSampleAvailableResources() {
        List<AvailableResource> resources = new ArrayList<>();

        resources.add(AvailableResource.builder()
            .userId("USER-1")
            .name("John Doe")
            .role("Senior Java Developer")
            .department("Development")
            .skillLevel("SENIOR")
            .hourlyRate(75.0)
            .availabilityPercentage(80.0)
            .skills(Arrays.asList("Java Developer", "Spring Framework", "Microservices"))
            .currentUtilization(60.0)
            .build());

        resources.add(AvailableResource.builder()
            .userId("USER-2")
            .name("Jane Smith")
            .role("Frontend Developer")
            .department("Development")
            .skillLevel("INTERMEDIATE")
            .hourlyRate(60.0)
            .availabilityPercentage(100.0)
            .skills(Arrays.asList("Frontend Developer", "React", "JavaScript"))
            .currentUtilization(40.0)
            .build());

        return resources;
    }

    private List<String> fetchActiveProjectIds() {
        return Arrays.asList("PROJ-001", "PROJ-002", "PROJ-003");
    }

    // Additional helper methods for calculations...
    private int calculateMonthlyResourceNeed(int monthIndex, ProjectRequirements requirements) {
        // Different phases may need different resource levels
        if (monthIndex < 1) return requirements.requiredHeadcount / 2; // Ramp up
        if (monthIndex > 4) return requirements.requiredHeadcount / 2; // Wind down
        return requirements.requiredHeadcount; // Full team
    }

    private List<String> getMonthlyMilestones(int monthIndex) {
        switch (monthIndex) {
            case 0: return Arrays.asList("Project kickoff", "Requirements finalization");
            case 1: return Arrays.asList("Design completion", "Development start");
            case 2: return Arrays.asList("MVP completion");
            case 3: return Arrays.asList("Testing phase start");
            case 4: return Arrays.asList("User acceptance testing");
            case 5: return Arrays.asList("Production deployment", "Project closure");
            default: return new ArrayList<>();
        }
    }

    private String calculateResourcePressure(int monthIndex, int plannedResources) {
        if (plannedResources > 10) return "HIGH";
        if (plannedResources > 6) return "MEDIUM";
        return "LOW";
    }

    private List<ResourcePlanningResponse.EquipmentResource> generateEquipmentNeeds(ProjectRequirements requirements) {
        List<ResourcePlanningResponse.EquipmentResource> equipment = new ArrayList<>();

        equipment.add(ResourcePlanningResponse.EquipmentResource.builder()
            .equipmentId("EQ-001")
            .name("Development Laptops")
            .category("HARDWARE")
            .quantity(requirements.requiredHeadcount)
            .unitCost(1500.0)
            .totalCost(1500.0 * requirements.requiredHeadcount)
            .vendor("Dell")
            .requiredDate(requirements.startDate)
            .status("IDENTIFIED")
            .priority("HIGH")
            .build());

        return equipment;
    }

    private List<ResourcePlanningResponse.SoftwareLicense> generateSoftwareRequirements(ProjectRequirements requirements) {
        List<ResourcePlanningResponse.SoftwareLicense> software = new ArrayList<>();

        software.add(ResourcePlanningResponse.SoftwareLicense.builder()
            .softwareId("SW-001")
            .name("IntelliJ IDEA")
            .licenseType("SUBSCRIPTION")
            .licenseCount(requirements.requiredHeadcount)
            .costPerLicense(149.0)
            .totalCost(149.0 * requirements.requiredHeadcount)
            .startDate(requirements.startDate)
            .expiryDate(requirements.endDate.plusYears(1))
            .vendor("JetBrains")
            .assignedUsers(new ArrayList<>())
            .build());

        return software;
    }

    private String calculateOverallRiskLevel(List<ResourcePlanningResponse.ResourceRisk> risks) {
        if (risks.stream().anyMatch(r -> "CRITICAL".equals(r.getSeverity()))) return "CRITICAL";
        if (risks.stream().anyMatch(r -> "HIGH".equals(r.getSeverity()))) return "HIGH";
        if (risks.stream().anyMatch(r -> "MEDIUM".equals(r.getSeverity()))) return "MEDIUM";
        return "LOW";
    }

    private double calculateIndustryAverage(ProjectRequirements requirements) {
        return 65.0; // Industry average hourly rate
    }

    private String calculateEfficiencyRating(ResourceAllocationResult result, ProjectRequirements requirements) {
        double efficiency = (requirements.totalBudget - result.allocatedBudget) / requirements.totalBudget * 100;
        if (efficiency > 20) return "EXCELLENT";
        if (efficiency > 10) return "GOOD";
        if (efficiency > 0) return "AVERAGE";
        return "POOR";
    }

    // Inner classes
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class ProjectRequirements {
        String projectId;
        String projectName;
        Integer requiredHeadcount;
        Double totalBudget;
        LocalDate startDate;
        LocalDate endDate;
        Map<String, Integer> requiredSkills;
        String priority;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class AvailableResource {
        String userId;
        String name;
        String role;
        String department;
        String skillLevel;
        Double hourlyRate;
        Double availabilityPercentage;
        List<String> skills;
        Double currentUtilization;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    private static class ResourceAllocationResult {
        List<ResourcePlanningResponse.ResourceAllocation> allocations;
        Double allocatedBudget;
        Integer allocatedCount;
        Map<String, Integer> unmetSkillRequirements;
    }
}
