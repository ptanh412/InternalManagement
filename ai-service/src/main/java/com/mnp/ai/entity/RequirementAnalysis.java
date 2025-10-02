package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.List;
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
@Document(collection = "requirement_analysis")
public class RequirementAnalysis {
    @MongoId
    String id;

    String documentId;
    String originalContent;

    List<String> extractedRequirements;
    List<GeneratedTask> suggestedTasks;
    Map<String, Object> analysisMetadata;
    LocalDateTime analyzedAt;
}
