package com.mnp.ai.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RequirementUploadRequest {

    @NotBlank(message = "Project ID is required")
    String projectId;

    String projectName;

    String description;

    @Size(max = 5, message = "Maximum 5 files allowed per upload")
    List<String> supportedFileTypes;

    @Builder.Default
    Boolean generateTasks = true;

    @Builder.Default
    Boolean analyzeRequirements = true;

    @Builder.Default
    Boolean detectConflicts = true;

    @Builder.Default
    Boolean identifySkills = true;

    String additionalContext;

    List<String> existingTaskIds;

    String priority; // HIGH, MEDIUM, LOW

    // Field for text-based requirements import
    String requirementText;
}
