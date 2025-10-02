package com.mnp.project.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateProjectSkillsRequest {
    @NotEmpty(message = "Skills to add cannot be empty")
    List<String> skillsToAdd;
}
