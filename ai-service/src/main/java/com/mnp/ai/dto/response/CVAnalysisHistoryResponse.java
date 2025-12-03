package com.mnp.ai.dto.response;

import java.time.LocalDateTime;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVAnalysisHistoryResponse {
    String id;
    String fileName;
    Long fileSize;
    String fileType;
    String cvFileUrl;
    String status;
    Double confidenceScore;
    Long processingTimeMs;

    // Parsed user profile info
    String extractedName;
    String extractedEmail;
    String extractedPhone;
    String extractedDepartment;
    String extractedSeniority;
    Integer totalSkills;

    // User creation info
    String createdUserId;
    String createdUsername;
    String createdUserEmail;

    // Metadata
    String createdBy;
    String createdByName;
    LocalDateTime analyzedAt;
    LocalDateTime userCreatedAt;
    String errorMessage;
    String notes;
}
