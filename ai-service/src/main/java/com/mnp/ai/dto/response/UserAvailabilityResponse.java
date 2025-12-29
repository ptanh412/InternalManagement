package com.mnp.ai.dto;

import java.time.LocalDate;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserAvailabilityResponse {
    String userId;
    Boolean isAvailable;
    Double availabilityPercentage;
    LocalDate nextAvailableDate;
    Integer currentTasksCount;
    Integer weeklyCapacity;
    Integer currentLoad;
}
