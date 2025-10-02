package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "cv_parsing_results")
public class CVParsingResult {
    @MongoId
    String id;

    String userId;
    String originalFileName;
    String fileType;
    String filePath;

    Map<String, Object> extractedData;
    Map<String, Object> personalInfo;
    Map<String, Object> workExperience;
    Map<String, Object> education;
    Map<String, Object> skills;

    Double confidenceScore;
    String status; // PROCESSING, COMPLETED, FAILED
    String errorMessage;

    LocalDateTime uploadedAt;
    LocalDateTime processedAt;
    LocalDateTime updatedAt;
}
