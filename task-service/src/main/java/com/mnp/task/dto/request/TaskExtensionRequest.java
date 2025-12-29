package com.mnp.task.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskExtensionRequest {
    @NotNull(message = "Extension hours is required")
    @Min(value = 1, message = "Extension must be at least 1 hour")
    Integer extensionHours;

    @NotNull(message = "Reason is required")
    @Size(min = 10, max = 500, message = "Reason must be between 10 and 500 characters")
    String reason;

    @NotNull(message = "New due date is required")
    LocalDate newDueDate; // Chỉ nhận ngày (YYYY-MM-DD)
}
