package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import com.mnp.ai.dto.response.TaskRequiredSkillResponse;
import com.mnp.ai.enums.GeneratedTaskStatus;
import com.mnp.ai.enums.TaskPriority;
import com.mnp.ai.enums.TaskType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "generated_tasks")
public class GeneratedTask {
    @MongoId
    String id;

    String analyzedRequirementId; // Reference to AnalyzedRequirement document
    String title;
    String description;
    TaskType taskType;
    TaskPriority priority;
    GeneratedTaskStatus status;

    List<TaskRequiredSkillResponse> requiredSkills; // Updated to use detailed skill structure
    Map<String, Object> taskMetadata;
    Double estimatedHours;
    Double confidenceScore;

    LocalDateTime generatedAt;
    LocalDateTime updatedAt;
}
