package com.mnp.ai.service;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.mnp.ai.dto.response.DepartmentInfo;
import com.mnp.ai.dto.response.PositionInfo;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class IdentityIntegrationService {

    private final WebClient webClient;

    // Predefined departments and their codes from identity-service
    private static final Map<String, String> DEPARTMENT_MAPPING = Map.of(
            "ENGINEERING", "Engineering",
            "FRONTEND", "Frontend Development",
            "BACKEND", "Backend Development",
            "QA", "Quality Assurance",
            "DEVOPS", "DevOps",
            "MOBILE", "Mobile Development");

    // Predefined seniority levels from identity-service
    private static final List<String> SENIORITY_LEVELS =
            Arrays.asList("INTERN", "JUNIOR", "MID_LEVEL", "SENIOR", "LEAD", "PRINCIPAL", "DIRECTOR");

    // Predefined roles from identity-service
    private static final List<String> SYSTEM_ROLES = Arrays.asList("ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "EMPLOYEE");

    /**
     * Get all available departments from identity-service
     */
    public List<DepartmentInfo> getAvailableDepartments() {
        try {
            log.info("Fetching departments from identity-service");

            // In a real implementation, this would call identity-service
            // For now, return the predefined departments
            return DEPARTMENT_MAPPING.entrySet().stream()
                    .map(entry -> DepartmentInfo.builder()
                            .code(entry.getKey())
                            .name(entry.getValue())
                            .build())
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.error("Failed to fetch departments from identity-service: {}", e.getMessage());
            // Return fallback departments
            return getFallbackDepartments();
        }
    }

    /**
     * Get all available positions from identity-service
     */
    public List<PositionInfo> getAvailablePositions() {
        try {
            log.info("Fetching positions from identity-service");

            // In a real implementation, this would call identity-service
            // For now, return predefined positions based on departments and seniority
            return generatePositionsFromMapping();

        } catch (Exception e) {
            log.error("Failed to fetch positions from identity-service: {}", e.getMessage());
            return getFallbackPositions();
        }
    }

    /**
     * Map CV skills to appropriate department
     */
    public String mapSkillsToDepartment(Map<String, Double> skills, String currentRole) {
        if (skills == null || skills.isEmpty()) {
            return "Engineering"; // Default fallback
        }

        // Create skill keywords mapping to departments using HashMap
        Map<String, String> skillToDepartment = new HashMap<>();

        // Frontend keywords
        skillToDepartment.put("react", "Frontend Development");
        skillToDepartment.put("vue", "Frontend Development");
        skillToDepartment.put("angular", "Frontend Development");
        skillToDepartment.put("javascript", "Frontend Development");
        skillToDepartment.put("typescript", "Frontend Development");
        skillToDepartment.put("html", "Frontend Development");
        skillToDepartment.put("css", "Frontend Development");
        skillToDepartment.put("ui", "Frontend Development");
        skillToDepartment.put("ux", "Frontend Development");
        skillToDepartment.put("frontend", "Frontend Development");
        skillToDepartment.put("web", "Frontend Development");

        // Backend keywords
        skillToDepartment.put("java", "Backend Development");
        skillToDepartment.put("spring", "Backend Development");
        skillToDepartment.put("python", "Backend Development");
        skillToDepartment.put("node", "Backend Development");
        skillToDepartment.put("api", "Backend Development");
        skillToDepartment.put("database", "Backend Development");
        skillToDepartment.put("sql", "Backend Development");
        skillToDepartment.put("microservices", "Backend Development");
        skillToDepartment.put("backend", "Backend Development");
        skillToDepartment.put("server", "Backend Development");
        skillToDepartment.put("rest", "Backend Development");
        skillToDepartment.put("graphql", "Backend Development");

        // Mobile keywords
        skillToDepartment.put("android", "Mobile Development");
        skillToDepartment.put("ios", "Mobile Development");
        skillToDepartment.put("flutter", "Mobile Development");
        skillToDepartment.put("react native", "Mobile Development");
        skillToDepartment.put("kotlin", "Mobile Development");
        skillToDepartment.put("swift", "Mobile Development");
        skillToDepartment.put("mobile", "Mobile Development");
        skillToDepartment.put("xamarin", "Mobile Development");

        // QA keywords
        skillToDepartment.put("testing", "Quality Assurance");
        skillToDepartment.put("selenium", "Quality Assurance");
        skillToDepartment.put("automation", "Quality Assurance");
        skillToDepartment.put("junit", "Quality Assurance");
        skillToDepartment.put("test", "Quality Assurance");
        skillToDepartment.put("qa", "Quality Assurance");
        skillToDepartment.put("quality", "Quality Assurance");
        skillToDepartment.put("cypress", "Quality Assurance");
        skillToDepartment.put("jest", "Quality Assurance");

        // DevOps keywords
        skillToDepartment.put("docker", "DevOps");
        skillToDepartment.put("kubernetes", "DevOps");
        skillToDepartment.put("aws", "DevOps");
        skillToDepartment.put("ci/cd", "DevOps");
        skillToDepartment.put("jenkins", "DevOps");
        skillToDepartment.put("terraform", "DevOps");
        skillToDepartment.put("linux", "DevOps");
        skillToDepartment.put("devops", "DevOps");
        skillToDepartment.put("cloud", "DevOps");
        skillToDepartment.put("ansible", "DevOps");
        skillToDepartment.put("gitlab", "DevOps");
        skillToDepartment.put("azure", "DevOps");
        skillToDepartment.put("gcp", "DevOps");

        // Score each department based on skills
        Map<String, Integer> departmentScores =
                DEPARTMENT_MAPPING.values().stream().collect(Collectors.toMap(dept -> dept, dept -> 0));

        for (String skill : skills.keySet()) {
            String lowerSkill = skill.toLowerCase();

            skillToDepartment.entrySet().stream()
                    .filter(entry -> lowerSkill.contains(entry.getKey()))
                    .forEach(entry -> {
                        String department = entry.getValue();
                        departmentScores.merge(department, 1, Integer::sum);
                    });
        }

        // Also consider current role
        if (currentRole != null && !currentRole.isEmpty()) {
            String lowerRole = currentRole.toLowerCase();
            skillToDepartment.entrySet().stream()
                    .filter(entry -> lowerRole.contains(entry.getKey()))
                    .forEach(entry -> {
                        String department = entry.getValue();
                        departmentScores.merge(department, 2, Integer::sum); // Higher weight for role
                    });
        }

        // Return department with highest score
        return departmentScores.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Engineering");
    }

    /**
     * Map experience years to seniority level
     */
    public String mapExperienceToSeniority(Double experienceYears) {
        if (experienceYears == null) return "JUNIOR";

        if (experienceYears < 1) return "INTERN";
        else if (experienceYears < 2) return "JUNIOR";
        else if (experienceYears < 5) return "MID_LEVEL";
        else if (experienceYears < 8) return "SENIOR";
        else if (experienceYears < 12) return "LEAD";
        else if (experienceYears < 15) return "PRINCIPAL";
        else return "DIRECTOR";
    }

    /**
     * Determine appropriate system role based on experience and skills
     */
    public String determineSystemRole(Double experienceYears, Map<String, Double> skills, String department) {
        if (experienceYears == null) return "EMPLOYEE";

        // Check for leadership/management skills
        boolean hasLeadershipSkills = skills != null
                && skills.keySet().stream()
                        .anyMatch(skill -> skill.toLowerCase().contains("leadership")
                                || skill.toLowerCase().contains("management")
                                || skill.toLowerCase().contains("mentoring"));

        // Determine role based on experience and leadership
        if (experienceYears >= 10 && hasLeadershipSkills) {
            return "PROJECT_MANAGER";
        } else if (experienceYears >= 5 && hasLeadershipSkills) {
            return "TEAM_LEAD";
        } else {
            return "EMPLOYEE";
        }
    }

    /**
     * Validate department name against identity-service departments
     */
    public boolean isValidDepartment(String departmentName) {
        return DEPARTMENT_MAPPING.containsValue(departmentName);
    }

    /**
     * Validate seniority level against identity-service levels
     */
    public boolean isValidSeniority(String seniorityLevel) {
        return SENIORITY_LEVELS.contains(seniorityLevel);
    }

    /**
     * Validate role against identity-service roles
     */
    public boolean isValidRole(String roleName) {
        return SYSTEM_ROLES.contains(roleName);
    }

    private List<DepartmentInfo> getFallbackDepartments() {
        return DEPARTMENT_MAPPING.entrySet().stream()
                .map(entry -> DepartmentInfo.builder()
                        .code(entry.getKey())
                        .name(entry.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    private List<PositionInfo> generatePositionsFromMapping() {
        // Generate positions for each department and seniority combination
        return DEPARTMENT_MAPPING.values().stream()
                .flatMap(department -> SENIORITY_LEVELS.stream().map(seniority -> PositionInfo.builder()
                        .title(generatePositionTitle(department, seniority))
                        .department(department)
                        .seniorityLevel(seniority)
                        .build()))
                .collect(Collectors.toList());
    }

    private String generatePositionTitle(String department, String seniority) {
        String baseTitle = department.replace(" Development", "").replace(" ", "");

        return switch (seniority) {
            case "INTERN" -> baseTitle + " Intern";
            case "JUNIOR" -> "Junior " + baseTitle + " Developer";
            case "MID_LEVEL" -> baseTitle + " Developer";
            case "SENIOR" -> "Senior " + baseTitle + " Developer";
            case "LEAD" -> baseTitle + " Team Lead";
            case "PRINCIPAL" -> "Principal " + baseTitle + " Engineer";
            case "DIRECTOR" -> "Director of " + department;
            default -> baseTitle + " Developer";
        };
    }

    private List<PositionInfo> getFallbackPositions() {
        return Arrays.asList(PositionInfo.builder()
                .title("Software Developer")
                .department("Engineering")
                .seniorityLevel("MID_LEVEL")
                .build());
    }
}
