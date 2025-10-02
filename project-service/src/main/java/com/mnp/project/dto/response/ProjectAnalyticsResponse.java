package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectAnalyticsResponse {
    Integer totalProjects;
    Integer activeProjects;
    Integer completedProjects;
    Integer onHoldProjects;
    Integer cancelledProjects;

    BigDecimal totalBudget;
    BigDecimal totalActualCost;
    BigDecimal budgetVariance;

    Double averageCompletionPercentage;
    Double onTimeDeliveryRate;

    Map<String, Integer> projectsByStatus;
    Map<String, Integer> projectsByPriority;
    Map<String, BigDecimal> budgetByStatus;
}
