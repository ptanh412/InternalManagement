package com.mnp.workload.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAvailabilityResponse {
    String userId;
   boolean isAvailable;
   Double availabilityPercentage;
    LocalDate nextAvailableDate = LocalDate.now();
    Integer currentTasksCount;
    Integer weeklyCapacity;
    Integer currentLoad;

}
