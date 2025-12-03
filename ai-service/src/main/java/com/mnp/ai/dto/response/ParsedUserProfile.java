package com.mnp.ai.dto.response;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParsedUserProfile {
    // Personal Information
    private String name;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String city;
    private String linkedIn;
    private String github;

    // Professional Summary
    private String currentRole;
    private String department;
    private String seniority;
    private Double experienceYears;

    // Skills and Competencies (matching UserProfile structure)
    private Map<String, Double> skills; // skill -> proficiency score (0-1)
    private Map<String, String> skillTypes; // skill -> type (PROGRAMMING_LANGUAGE, FRAMEWORK, etc.)
    private Map<String, Integer> skillExperience; // skill -> years of experience
    private List<String> mandatorySkills; // List of essential skills

    // Work Experience
    private List<Map<String, Object>> workHistory;

    // Education
    private List<Map<String, Object>> education;

    // Certifications
    private List<String> certifications;
    private List<Map<String, Object>> certificationsDetails;

    // Projects
    private List<Map<String, Object>> projects;

    // Languages
    private Map<String, String> languages; // language -> proficiency level

    // Performance Indicators (estimated by AI)
    private Double estimatedProductivity; // 0-1
    private Double adaptabilityScore; // 0-1
    private Double leadershipPotential; // 0-1
    private Double technicalComplexityHandling; // 0-1
    private Double collaborationScore; // 0-1
}
