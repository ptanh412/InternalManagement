package com.mnp.identity.dto.response;

import java.util.Map;

import com.mnp.identity.enums.SeniorityLevel;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PositionResponse {
    String id;
    String title;
    String description;
    String departmentId;
    String departmentName;
    SeniorityLevel seniorityLevel;
    Map<String, Double> requiredSkills;
}
