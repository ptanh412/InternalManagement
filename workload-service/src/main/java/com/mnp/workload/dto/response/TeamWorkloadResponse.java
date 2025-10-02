package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeamWorkloadResponse {
    String departmentId;
    String departmentName;
    Integer totalTeamMembers;
    Double averageUtilization;
    Integer totalCapacityHours;
    Integer totalAllocatedHours;
    List<UserWorkloadSummary> teamMembers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class UserWorkloadSummary {
        String userId;
        String userName;
        Double utilizationPercentage;
        Integer capacityHours;
        Integer allocatedHours;
        Integer availableHours;
        String status; // "Available", "Overloaded", "At Capacity"
    }
}
