package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Candidate Profile DTO for ML operations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileDto {
    private String userId;
    private String email;
    private String name;
    private List<String> skills;
    private Double yearsExperience;
    private String seniorityLevel;
    private Double utilization;
    private Double performanceScore;
    private String availabilityStatus;
    private Integer currentWorkloadHours;
    private String departmentName;  // Real department name from identity-service
}

