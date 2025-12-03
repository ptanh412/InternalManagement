package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDto {

    private String userId;

    private String firstName;

    private String lastName;

    private String email;

    private String departmentId;

    private String positionId;

    private Double performanceScore;

    private List<UserSkillDto> skills;

    private Integer yearsExperience;

    private String availabilityStatus;

    private Double currentWorkloadHours;

    private LocalDateTime lastActive;
}
