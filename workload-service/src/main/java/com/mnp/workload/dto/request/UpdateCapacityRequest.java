package com.mnp.workload.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateCapacityRequest {
    @NotNull(message = "Weekly capacity hours is required")
    @Min(value = 1, message = "Weekly capacity must be at least 1 hour")
    Integer weeklyCapacityHours;

    @Min(value = 1, message = "Daily capacity must be at least 1 hour")
    Integer dailyCapacityHours = 8;
}
