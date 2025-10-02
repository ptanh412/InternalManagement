package com.mnp.ai.dto.request;

import jakarta.validation.constraints.NotNull;

import org.springframework.web.multipart.MultipartFile;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVParsingRequest {

    @NotNull(message = "CV file is required")
    MultipartFile cvFile;

    String additionalNotes;

    @Builder.Default
    Boolean createIdentityProfile = true;

    @Builder.Default
    Boolean createUserProfile = true;

    @Builder.Default
    Boolean extractSkills = true;

    @Builder.Default
    Boolean detectExperience = true;

    String preferredUsername;
    String departmentHint;
    String positionHint;
}
