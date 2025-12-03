package com.mnp.ai.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserWorkloadResponse {
    String userId;
    String userName;
    String departmentId;
    Integer weeklyCapacityHours;
    Integer dailyCapacityHours;
    Double utilizationPercentage;
    String skillSet;
    String status;
    LocalDate nextAvailableDate;
    Integer totalEstimateHours;
    Integer totalActualHours;
    Integer upcomingWeekHours;
    Double availabilityPercentage;
    Integer currentTasksCount;
    LocalDateTime lastUpdated;
}
