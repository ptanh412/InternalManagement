package com.internalmanagement.mlservice.controller;

import com.internalmanagement.mlservice.dto.*;
import com.internalmanagement.mlservice.service.ModelTrainingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;

/**
 * REST controller for ML model training and management
 */
@RestController
@RequestMapping("/ml/training")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ModelTrainingController {

    private final ModelTrainingService modelTrainingService;

    /**
     * Trigger model training
     */
    @PostMapping("/start")
    public ResponseEntity<TrainingResponseDto> startTraining(
            @Valid @RequestBody TrainingRequestDto request) {
        
        log.info("Received training request: force={}, synthetic={}", 
                request.isForceRetrain(), request.isUseSyntheticData());
        
        try {
            TrainingResponseDto response = modelTrainingService.startTraining(request);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to start training: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(TrainingResponseDto.builder()
                            .success(false)
                            .message("Failed to start training: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get training status
     */
    @GetMapping("/status")
    public ResponseEntity<TrainingStatusDto> getTrainingStatus() {
        
        try {
            TrainingStatusDto status = modelTrainingService.getTrainingStatus();
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("Failed to get training status: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(TrainingStatusDto.builder()
                            .status("ERROR")
                            .message("Failed to get training status: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get training history
     */
    @GetMapping("/history")
    public ResponseEntity<List<TrainingHistoryDto>> getTrainingHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Integer daysBack) {
        
        log.info("Getting training history: page={}, size={}, daysBack={}", page, size, daysBack);
        
        try {
            Page<TrainingHistoryDto> history = modelTrainingService
                    .getTrainingHistoryDto(page, size, daysBack);

            return ResponseEntity.ok(
                    history.getContent());
            
        } catch (Exception e) {
            log.error("Failed to get training history: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get model performance metrics
     */
    @GetMapping("/performance")
    public ResponseEntity<ModelPerformanceDto> getModelPerformance() {
        
        try {
            ModelPerformanceDto performance = modelTrainingService.getModelPerformance();
            
            return ResponseEntity.ok(performance);
            
        } catch (Exception e) {
            log.error("Failed to get model performance: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Cancel ongoing training
     */
    @PostMapping("/cancel")
    public ResponseEntity<CancelTrainingResponseDto> cancelTraining() {
        
        log.info("Received training cancellation request");
        
        try {
            CancelTrainingResponseDto response = modelTrainingService.cancelTraining();
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to cancel training: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(CancelTrainingResponseDto.builder()
                            .success(false)
                            .message("Failed to cancel training: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Validate training data
     */
    @PostMapping("/validate-data")
    public ResponseEntity<DataValidationDto> validateTrainingData(
            @RequestParam(required = false) Integer monthsBack) {
        
        log.info("Validating training data for last {} months", monthsBack);
        
        try {
            TrainingDataValidationDto validation = modelTrainingService
                    .validateTrainingData(monthsBack);
            
            // Convert to expected DTO
            DataValidationDto dataValidation = DataValidationDto.builder()
                    .isValid(validation.isValid())
                    .totalRecords(validation.getTotalRecords())
                    .validRecords(validation.getValidRecords())
                    .invalidRecords(validation.getInvalidRecords())
                    .validationErrors(validation.getValidationErrors())
                    .dataQualityScore(validation.getDataQualityScore())
                    .validatedAt(validation.getValidatedAt())
                    .dataSource(validation.getDataSource())
                    .monthsValidated(validation.getMonthsValidated())
                    .qualityMetrics(validation.getQualityMetrics())
                    .build();

            return ResponseEntity.ok(dataValidation);

        } catch (Exception e) {
            log.error("Failed to validate training data: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(DataValidationDto.builder()
                            .message("Failed to validate training data: " + e.getMessage())
                            .build());
        }
    }

    /**
     * Get feature importance from latest model
     */
    @GetMapping("/feature-importance")
    public ResponseEntity<FeatureImportanceDto> getFeatureImportance() {
        
        try {
            FeatureImportanceDto featureImportance = modelTrainingService
                    .getFeatureImportance();
            
            return ResponseEntity.ok(featureImportance);
            
        } catch (Exception e) {
            log.error("Failed to get feature importance: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Schedule or configure continuous training
     */
    @PostMapping("/continuous/configure")
    public ResponseEntity<ContinuousTrainingStatusDto> configureContinuousTraining(
            @Valid @RequestBody ContinuousTrainingConfigDto config) {
        
        log.info("Configuring continuous training with frequency: {} hours", 
                config.getTrainingFrequencyHours());
        
        try {
            ContinuousTrainingStatusDto response = modelTrainingService
                    .configureContinuousTraining(config);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Failed to configure continuous training: {}", e.getMessage());
            
            return ResponseEntity.internalServerError()
                    .body(ContinuousTrainingStatusDto.builder()
                            .enabled(false)
                            .build());
        }
    }

    /**
     * Get continuous training status
     */
    @GetMapping("/continuous/status")
    public ResponseEntity<ContinuousTrainingStatusDto> getContinuousTrainingStatus() {
        
        try {
            ContinuousTrainingStatusDto status = modelTrainingService
                    .getContinuousTrainingStatus();
            
            return ResponseEntity.ok(status);
            
        } catch (Exception e) {
            log.error("Failed to get continuous training status: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Export model for deployment
     */
//    @PostMapping("/export")
//    public ResponseEntity<ModelExportDto> exportModel(
//            @RequestParam(required = false) String version) {
//
//        log.info("Exporting model version: {}", version);
//
//        try {
//            ModelExportDto export = modelTrainingService.exportModel(version);
//
//            return ResponseEntity.ok(export);
//
//        } catch (Exception e) {
//            log.error("Failed to export model: {}", e.getMessage());
//
//            return ResponseEntity.internalServerError()
//                    .body(ModelExportDto.builder()
//                            .success(false)
//                            .message("Failed to export model: " + e.getMessage())
//                            .build());
//        }
//    }
}