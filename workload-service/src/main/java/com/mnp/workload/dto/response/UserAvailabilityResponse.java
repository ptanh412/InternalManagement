package com.mnp.workload.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAvailabilityResponse {
    String userId;
    Boolean isAvailable;  // Changed from boolean to Boolean to match AI service DTO and fix getter method name
    Double availabilityPercentage;
    LocalDate nextAvailableDate;
    Integer currentTasksCount;
    Integer weeklyCapacity;
    Integer currentLoad;

}
