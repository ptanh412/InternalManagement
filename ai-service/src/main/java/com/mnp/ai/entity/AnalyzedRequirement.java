package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import com.mnp.ai.enums.RequirementPriority;
import com.mnp.ai.enums.RequirementType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "analyzed_requirements")
public class AnalyzedRequirement {
    @MongoId
    String id;

    String projectId;
    String documentId;
    String title;
    String description;
    String originalContent;

    RequirementType requirementType;
    RequirementPriority priority;

    List<String> extractedRequirements;
    List<String> functionalRequirements;
    List<String> nonFunctionalRequirements;
    List<RequiredSkillInfo> requiredSkills;

    Map<String, Object> analysisMetadata;
    Double complexityScore;
    Integer estimatedEffort;

    LocalDateTime analyzedAt;
    LocalDateTime updatedAt;
    String analyzedBy; // AI model version or user ID
}
