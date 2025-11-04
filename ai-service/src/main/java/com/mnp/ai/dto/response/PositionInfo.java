package com.mnp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionInfo {
    private String title;
    private String department;
    private String seniorityLevel;
    private String description;
    private Map<String, Double> requiredSkills;
}
