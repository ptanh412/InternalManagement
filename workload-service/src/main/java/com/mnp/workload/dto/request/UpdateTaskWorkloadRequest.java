package com.mnp.workload.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateTaskWorkloadRequest {
    @Min(value = 0, message = "Estimated hours cannot be negative")
    Integer estimatedHours;

    @Min(value = 0, message = "Actual hours cannot be negative")
    Integer actualHoursSpent;

    @Min(value = 0, message = "Progress cannot be negative")
    @Max(value = 100, message = "Progress cannot exceed 100%")
    Double progressPercentage;

    @Min(value = 0, message = "Remaining hours cannot be negative")
    Integer remainingHours;
}
