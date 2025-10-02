package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AvailableUsersResponse {
    List<AvailableUser> availableUsers;
    Integer totalAvailableUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class AvailableUser {
        String userId;
        String userName;
        String departmentId;
        Integer availableHours;
        Double utilizationPercentage;
        String skillSet;
        String nextAvailableDate;
    }
}
