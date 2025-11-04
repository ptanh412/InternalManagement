package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Additional DTOs for model training operations
 */

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CancelTrainingResponseDto {

    private boolean success;
    
    private String message;
    
    private String trainingId;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataValidationDto {

    private boolean valid;
    
    private String message;
    
    private int totalRecords;
    
    private int validRecords;
    
    private int invalidRecords;
    
    private List<String> validationErrors;
    
    private Map<String, Integer> dataQualityMetrics;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureImportanceDto {

    private String modelVersion;
    
    private LocalDateTime calculatedAt;
    
    private Map<String, Double> featureImportances;
    
    private List<FeatureImportanceItemDto> topFeatures;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureImportanceItemDto {

    private String featureName;
    
    private Double importance;
    
    private String description;
    
    private String category;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousTrainingConfigDto {

    private boolean enabled;
    
    private String message;
    
    private int trainingFrequencyHours;
    
    private Double minAccuracyImprovement;
    
    private int minDataSize;
    
    private boolean autoDeployment;
    
    private String schedule; // Cron expression
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousTrainingStatusDto {

    private boolean enabled;
    
    private LocalDateTime lastTraining;
    
    private LocalDateTime nextTraining;
    
    private String status; // ACTIVE, PAUSED, ERROR
    
    private String message;
    
    private int trainingCount;
    
    private int successfulTrainings;
    
    private int failedTrainings;
}

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelExportDto {

    private boolean success;
    
    private String message;
    
    private String modelVersion;
    
    private String exportPath;
    
    private String format; // PICKLE, ONNX, JOBLIB
    
    private long fileSizeBytes;
    
    private LocalDateTime exportedAt;
    
    private Map<String, Object> metadata;
}