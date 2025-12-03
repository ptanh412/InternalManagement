package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationItemDto {

    private String userId;

    private String userName;

    private String userEmail;

    private Double score;

    private Integer rank;

    private String reason;

    private List<String> matchedSkills;

    private List<String> missingSkills;

    private Double skillMatchScore;

    private Double performanceScore;

    private Double availabilityScore;

    private Double workloadScore;

    private Map<String, Object> additionalInfo;
}
