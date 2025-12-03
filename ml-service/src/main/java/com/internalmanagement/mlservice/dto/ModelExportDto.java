package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModelExportDto {

    private boolean success;

    private String message;

    private String version;

    private String modelVersion;

    private String exportPath;

    private String format; // PICKLE, ONNX, JOBLIB

    private long fileSizeBytes;

    private LocalDateTime exportedAt;

    private Map<String, Object> metadata;
}