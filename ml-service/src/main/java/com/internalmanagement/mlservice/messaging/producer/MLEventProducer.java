package com.internalmanagement.mlservice.messaging.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Kafka producer for ML-related events
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MLEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.ml-model-updated}")
    private String modelUpdatedTopic;

    @Value("${app.kafka.topics.ml-prediction}")
    private String predictionTopic;

    @Value("${app.kafka.topics.ml-training-status}")
    private String trainingStatusTopic;

    /**
     * Send model update notification
     */
    public void sendModelUpdateNotification(String modelVersion, Map<String, Object> metrics) {
        try {
            ModelUpdateEvent event = ModelUpdateEvent.builder()
                    .modelVersion(modelVersion)
                    .updateTimestamp(java.time.LocalDateTime.now())
                    .metrics(metrics)
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);

            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    modelUpdatedTopic, 
                    modelVersion, 
                    eventJson
            );

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Successfully sent model update notification for version: {}", modelVersion);
                } else {
                    log.error("Failed to send model update notification: {}", ex.getMessage(), ex);
                }
            });

        } catch (Exception e) {
            log.error("Failed to serialize model update event: {}", e.getMessage(), e);
        }
    }

    /**
     * Send prediction result for tracking
     */
    public void sendPredictionResult(String taskId, String userId, double confidence, 
                                   String modelVersion) {
        try {
            PredictionEvent event = PredictionEvent.builder()
                    .taskId(taskId)
                    .userId(userId)
                    .confidence(confidence)
                    .modelVersion(modelVersion)
                    .predictionTimestamp(java.time.LocalDateTime.now())
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);
            String key = taskId + "_" + userId;

            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    predictionTopic, 
                    key, 
                    eventJson
            );

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.debug("Successfully sent prediction event for task: {} and user: {}", 
                            taskId, userId);
                } else {
                    log.error("Failed to send prediction event: {}", ex.getMessage(), ex);
                }
            });

        } catch (Exception e) {
            log.error("Failed to serialize prediction event: {}", e.getMessage(), e);
        }
    }

    /**
     * Send training status update
     */
    public void sendTrainingStatusUpdate(String trainingId, String status, 
                                       Map<String, Object> details) {
        try {
            TrainingStatusEvent event = TrainingStatusEvent.builder()
                    .trainingId(trainingId)
                    .status(status)
                    .details(details)
                    .timestamp(java.time.LocalDateTime.now())
                    .build();

            String eventJson = objectMapper.writeValueAsString(event);

            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    trainingStatusTopic, 
                    trainingId, 
                    eventJson
            );

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Successfully sent training status update: {} for training: {}", 
                            status, trainingId);
                } else {
                    log.error("Failed to send training status update: {}", ex.getMessage(), ex);
                }
            });

        } catch (Exception e) {
            log.error("Failed to serialize training status event: {}", e.getMessage(), e);
        }
    }

    /**
     * Send generic ML event
     */
    public void sendMLEvent(String topic, String key, Object event) {
        try {
            String eventJson = objectMapper.writeValueAsString(event);

            CompletableFuture<SendResult<String, String>> future = kafkaTemplate.send(
                    topic, 
                    key, 
                    eventJson
            );

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.debug("Successfully sent ML event to topic: {}", topic);
                } else {
                    log.error("Failed to send ML event to topic {}: {}", topic, ex.getMessage(), ex);
                }
            });

        } catch (Exception e) {
            log.error("Failed to serialize ML event: {}", e.getMessage(), e);
        }
    }

    // Inner classes for event structures
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ModelUpdateEvent {
        private String modelVersion;
        private java.time.LocalDateTime updateTimestamp;
        private Map<String, Object> metrics;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PredictionEvent {
        private String taskId;
        private String userId;
        private double confidence;
        private String modelVersion;
        private java.time.LocalDateTime predictionTimestamp;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class TrainingStatusEvent {
        private String trainingId;
        private String status;
        private Map<String, Object> details;
        private java.time.LocalDateTime timestamp;
    }
}