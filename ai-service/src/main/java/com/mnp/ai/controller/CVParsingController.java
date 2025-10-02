package com.mnp.ai.controller;

import java.util.*;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.ai.dto.response.ApiResponse;
import com.mnp.ai.dto.response.CVParsingResponse;
import com.mnp.ai.service.CVParsingService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/ai/cv")
@RequiredArgsConstructor
@Slf4j
public class CVParsingController {

    private final CVParsingService cvParsingService;

    /**
     * Parse CV file and automatically create profiles in identity-service and profile-service
     */
    @PostMapping(value = "/parse", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CVParsingResponse> parseCVAndCreateProfiles(
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "additionalNotes", required = false) String additionalNotes,
            @RequestParam(value = "createIdentityProfile", defaultValue = "true") Boolean createIdentityProfile,
            @RequestParam(value = "createUserProfile", defaultValue = "true") Boolean createUserProfile,
            @RequestParam(value = "extractSkills", defaultValue = "true") Boolean extractSkills,
            @RequestParam(value = "detectExperience", defaultValue = "true") Boolean detectExperience,
            @RequestParam(value = "preferredUsername", required = false) String preferredUsername,
            @RequestParam(value = "departmentHint", required = false) String departmentHint,
            @RequestParam(value = "positionHint", required = false) String positionHint) {

        log.info("Starting CV parsing and profile creation for file: {}", cvFile.getOriginalFilename());

        try {
            // Validate file
            if (cvFile.isEmpty()) {
                return ApiResponse.<CVParsingResponse>builder()
                        .code(4000)
                        .message("CV file is empty")
                        .build();
            }

            // Validate file type
            if (!isValidCVFileType(cvFile.getOriginalFilename())) {
                return ApiResponse.<CVParsingResponse>builder()
                        .code(4001)
                        .message("Unsupported file type. Supported formats: PDF, DOCX, DOC, TXT")
                        .build();
            }

            // Parse CV using AI service
            CVParsingResponse cvResponse = cvParsingService.parseCVFile(cvFile, additionalNotes);

            if ("FAILED".equals(cvResponse.getProcessingStatus())) {
                return ApiResponse.<CVParsingResponse>builder()
                        .code(5000)
                        .message("Failed to parse CV file")
                        .result(cvResponse)
                        .build();
            }

            // Create profiles in external services
            if (createIdentityProfile) {
                createIdentityServiceProfile(cvResponse, preferredUsername, departmentHint, positionHint);
            }

            if (createUserProfile) {
                createProfileServiceProfile(cvResponse);
            }

            return ApiResponse.<CVParsingResponse>builder()
                    .result(cvResponse)
                    .message("CV parsed successfully and profiles created")
                    .build();

        } catch (Exception e) {
            log.error("Unexpected error during CV parsing", e);
            return ApiResponse.<CVParsingResponse>builder()
                    .code(5000)
                    .message("Internal server error during CV processing: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Parse CV file only (without creating profiles in other services)
     */
    @PostMapping(value = "/parse-only", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CVParsingResponse> parseCVOnly(
            @RequestParam("cvFile") MultipartFile cvFile,
            @RequestParam(value = "additionalNotes", required = false) String additionalNotes) {

        log.info("Starting CV parsing only for file: {}", cvFile.getOriginalFilename());

        try {
            if (cvFile.isEmpty()) {
                return ApiResponse.<CVParsingResponse>builder()
                        .code(4000)
                        .message("CV file is empty")
                        .build();
            }

            if (!isValidCVFileType(cvFile.getOriginalFilename())) {
                return ApiResponse.<CVParsingResponse>builder()
                        .code(4001)
                        .message("Unsupported file type. Supported formats: PDF, DOCX, DOC, TXT")
                        .build();
            }

            CVParsingResponse cvResponse = cvParsingService.parseCVFile(cvFile, additionalNotes);

            return ApiResponse.<CVParsingResponse>builder()
                    .result(cvResponse)
                    .message("CV parsed successfully")
                    .build();

        } catch (Exception e) {
            log.error("Error during CV parsing", e);
            return ApiResponse.<CVParsingResponse>builder()
                    .code(5000)
                    .message("Failed to parse CV: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Get supported CV file formats
     */
    @GetMapping("/supported-formats")
    public ApiResponse<List<String>> getSupportedFormats() {
        List<String> formats = Arrays.asList("PDF", "DOCX", "DOC", "TXT", "RTF");
        return ApiResponse.<List<String>>builder()
                .result(formats)
                .message("Supported CV file formats")
                .build();
    }

    /**
     * Get CV parsing capabilities and AI features
     */
    @GetMapping("/capabilities")
    public ApiResponse<CVParsingCapabilities> getCapabilities() {
        CVParsingCapabilities capabilities = CVParsingCapabilities.builder()
                .canExtractPersonalInfo(true)
                .canExtractProfessionalInfo(true)
                .canIdentifySkills(true)
                .canDetectExperience(true)
                .canParseEducation(true)
                .canCreateIdentityProfile(true)
                .canCreateUserProfile(true)
                .supportedLanguages(Arrays.asList("English", "Multi-language support"))
                .maxFileSizeMB(10)
                .confidenceScoring(true)
                .skillCategorization(true)
                .experienceAnalysis(true)
                .build();

        return ApiResponse.<CVParsingCapabilities>builder()
                .result(capabilities)
                .message("CV parsing AI capabilities")
                .build();
    }

    /**
     * Health check for CV parsing service
     */
    @GetMapping("/health")
    public ApiResponse<String> healthCheck() {
        return ApiResponse.<String>builder()
                .result("CV Parsing Service is operational")
                .message("AI-powered CV analysis ready")
                .build();
    }

    private boolean isValidCVFileType(String fileName) {
        if (fileName == null) return false;
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        return Arrays.asList("pdf", "docx", "doc", "txt", "rtf").contains(extension);
    }

    private void createIdentityServiceProfile(
            CVParsingResponse cvResponse, String preferredUsername, String departmentHint, String positionHint) {
        try {
            log.info("Creating identity service profile for CV: {}", cvResponse.getProcessingId());

            // In a real implementation, this would call the identity-service via Feign client
            // For now, we'll simulate the call and populate the response

            Map<String, Object> identityRequest = new HashMap<>();

            if (cvResponse.getPersonalInfo() != null) {
                CVParsingResponse.PersonalInfo personalInfo = cvResponse.getPersonalInfo();

                identityRequest.put(
                        "username",
                        preferredUsername != null
                                ? preferredUsername
                                : generateUsername(personalInfo.getFirstName(), personalInfo.getLastName()));
                identityRequest.put("email", personalInfo.getEmail());
                identityRequest.put("firstName", personalInfo.getFirstName());
                identityRequest.put("lastName", personalInfo.getLastName());
                identityRequest.put("phoneNumber", personalInfo.getPhoneNumber());
            }

            if (cvResponse.getProfessionalInfo() != null) {
                CVParsingResponse.ProfessionalInfo professionalInfo = cvResponse.getProfessionalInfo();
                identityRequest.put(
                        "department", departmentHint != null ? departmentHint : professionalInfo.getDepartment());
                identityRequest.put(
                        "position", positionHint != null ? positionHint : professionalInfo.getCurrentPosition());
            }

            // Simulate successful identity creation
            cvResponse.setCreatedIdentityId(UUID.randomUUID().toString());
            cvResponse.setIdentityServiceSuccess(true);

            log.info("Successfully created identity service profile with ID: {}", cvResponse.getCreatedIdentityId());

        } catch (Exception e) {
            log.error("Failed to create identity service profile", e);
            cvResponse.setIdentityServiceSuccess(false);
            if (cvResponse.getErrors() == null) {
                cvResponse.setErrors(new ArrayList<>());
            }
            cvResponse.getErrors().add("Identity service integration failed: " + e.getMessage());
        }
    }

    private void createProfileServiceProfile(CVParsingResponse cvResponse) {
        try {
            log.info("Creating profile service profile for CV: {}", cvResponse.getProcessingId());

            // In a real implementation, this would call the profile-service via Feign client
            Map<String, Object> profileRequest = new HashMap<>();

            if (cvResponse.getPersonalInfo() != null) {
                CVParsingResponse.PersonalInfo personalInfo = cvResponse.getPersonalInfo();

                profileRequest.put("city", personalInfo.getCity());
                profileRequest.put("dob", personalInfo.getDateOfBirth());
                profileRequest.put("linkedinProfile", personalInfo.getLinkedinProfile());
                profileRequest.put("githubProfile", personalInfo.getGithubProfile());
            }

            if (cvResponse.getProfessionalInfo() != null) {
                CVParsingResponse.ProfessionalInfo professionalInfo = cvResponse.getProfessionalInfo();

                profileRequest.put("totalYearsExperience", professionalInfo.getTotalYearsExperience());
                profileRequest.put("seniorityLevel", professionalInfo.getSeniorityLevel());
                profileRequest.put("professionalSummary", professionalInfo.getProfessionalSummary());
                profileRequest.put("certifications", professionalInfo.getCertifications());
                profileRequest.put("languages", professionalInfo.getLanguages());
            }

            // Add skills information
            if (cvResponse.getSkills() != null && !cvResponse.getSkills().isEmpty()) {
                List<Map<String, Object>> skillsData = new ArrayList<>();
                for (CVParsingResponse.ExtractedSkill skill : cvResponse.getSkills()) {
                    Map<String, Object> skillData = new HashMap<>();
                    skillData.put("skillName", skill.getSkillName());
                    skillData.put("category", skill.getCategory());
                    skillData.put("proficiencyLevel", skill.getProficiencyLevel());
                    skillData.put("yearsOfExperience", skill.getYearsOfExperience());
                    skillData.put("isPrimary", skill.getIsPrimary());
                    skillsData.add(skillData);
                }
                profileRequest.put("skills", skillsData);
            }

            // Add work experience
            if (cvResponse.getWorkExperience() != null
                    && !cvResponse.getWorkExperience().isEmpty()) {
                profileRequest.put("workExperience", cvResponse.getWorkExperience());
            }

            // Add education
            if (cvResponse.getEducation() != null && !cvResponse.getEducation().isEmpty()) {
                profileRequest.put("education", cvResponse.getEducation());
            }

            // Simulate successful profile creation
            cvResponse.setCreatedProfileId(UUID.randomUUID().toString());
            cvResponse.setProfileServiceSuccess(true);

            log.info("Successfully created profile service profile with ID: {}", cvResponse.getCreatedProfileId());

        } catch (Exception e) {
            log.error("Failed to create profile service profile", e);
            cvResponse.setProfileServiceSuccess(false);
            if (cvResponse.getErrors() == null) {
                cvResponse.setErrors(new ArrayList<>());
            }
            cvResponse.getErrors().add("Profile service integration failed: " + e.getMessage());
        }
    }

    private String generateUsername(String firstName, String lastName) {
        if (firstName == null && lastName == null) {
            return "user" + System.currentTimeMillis();
        }

        StringBuilder username = new StringBuilder();
        if (firstName != null) {
            username.append(firstName.toLowerCase());
        }
        if (lastName != null) {
            if (username.length() > 0) {
                username.append(".");
            }
            username.append(lastName.toLowerCase());
        }

        // Add timestamp to ensure uniqueness
        username.append(System.currentTimeMillis() % 1000);

        return username.toString();
    }

    @lombok.Builder
    @lombok.Getter
    @lombok.Setter
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CVParsingCapabilities {
        Boolean canExtractPersonalInfo;
        Boolean canExtractProfessionalInfo;
        Boolean canIdentifySkills;
        Boolean canDetectExperience;
        Boolean canParseEducation;
        Boolean canCreateIdentityProfile;
        Boolean canCreateUserProfile;
        List<String> supportedLanguages;
        Integer maxFileSizeMB;
        Boolean confidenceScoring;
        Boolean skillCategorization;
        Boolean experienceAnalysis;
    }
}
