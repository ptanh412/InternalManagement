package com.mnp.ai.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVParsingResponse {

    String processingId;
    LocalDateTime processedAt;
    String fileName;
    String processingStatus; // SUCCESS, PARTIAL, FAILED

    // Extracted personal information
    PersonalInfo personalInfo;

    // Extracted professional information
    ProfessionalInfo professionalInfo;

    // Skills and competencies
    List<ExtractedSkill> skills;

    // Work experience
    List<WorkExperience> workExperience;

    // Education background
    List<Education> education;

    // Processing metadata
    Double confidenceScore;
    List<String> warnings;
    List<String> errors;
    Long processingTimeMs;

    // Service integration results
    String createdIdentityId;
    String createdProfileId;
    Boolean identityServiceSuccess;
    Boolean profileServiceSuccess;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PersonalInfo {
        String firstName;
        String lastName;
        String email;
        String phoneNumber;
        LocalDate dateOfBirth;
        String address;
        String city;
        String country;
        String linkedinProfile;
        String githubProfile;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ProfessionalInfo {
        String currentPosition;
        String currentCompany;
        String department;
        String seniorityLevel;
        Integer totalYearsExperience;
        String professionalSummary;
        List<String> certifications;
        List<String> languages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ExtractedSkill {
        String skillName;
        String category;
        Double proficiencyLevel;
        Integer yearsOfExperience;
        Boolean isPrimary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class WorkExperience {
        String position;
        String company;
        LocalDate startDate;
        LocalDate endDate;
        String description;
        List<String> achievements;
        List<String> technologies;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class Education {
        String degree;
        String institution;
        String fieldOfStudy;
        LocalDate graduationDate;
        String grade;
        List<String> relevantCourses;
    }
}
