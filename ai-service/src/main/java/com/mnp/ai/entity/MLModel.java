package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.mongodb.core.mapping.Document;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "ml_models")
public class MLModel {
    String id;
    String modelName;
    String modelType;
    String modelPath;
    String modelVersion;
    Map<String, Object> hyperParameters;
    Double accuracy;
    LocalDateTime trainedAt;
    LocalDateTime lastUsedAt;
    boolean isActive;
}
