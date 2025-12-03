package com.mnp.task.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateTaskWorkloadRequest {
    Integer estimatedHours;
    Integer actualHoursSpent;
    Double progressPercentage;
    Integer remainingHours;
}
