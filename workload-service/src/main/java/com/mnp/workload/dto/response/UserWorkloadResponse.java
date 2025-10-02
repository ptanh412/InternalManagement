package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
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
