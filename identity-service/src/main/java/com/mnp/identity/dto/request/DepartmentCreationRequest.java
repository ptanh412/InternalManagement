package com.mnp.identity.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DepartmentCreationRequest {
    @NotBlank(message = "Department name is required")
    String name;

    String description;
    String teamLeadId;
}
