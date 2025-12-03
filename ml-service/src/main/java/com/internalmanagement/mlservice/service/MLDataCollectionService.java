package com.internalmanagement.mlservice.service;

import com.internalmanagement.mlservice.entity.MLTrainingEvent;
import com.internalmanagement.mlservice.messaging.events.TaskAssignmentEvent;
import com.internalmanagement.mlservice.messaging.events.TaskCompletionEvent;
import com.internalmanagement.mlservice.messaging.events.UserProfileUpdateEvent;
import com.internalmanagement.mlservice.repository.MLTrainingEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

/**
 * Service for processing ML training events from Kafka
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MLDataCollectionService {

    private final MLTrainingEventRepository mlTrainingEventRepository;

    /**
     * Process task completion event for ML training
     */
    public void processTaskCompletionEvent(TaskCompletionEvent event) {
        log.info("Processing task completion event for task: {}", event.getTaskId());

        try {
            MLTrainingEvent mlEvent = MLTrainingEvent.builder()
                    .taskId(event.getTaskId())
                    .userId(event.getAssignedUserId())
                    .eventType(MLTrainingEvent.EventType.TASK_COMPLETION)
                    .completionDate(event.getCompletedAt())
                    .actualHours(event.getActualHours())
                    .estimatedHours(event.getEstimatedHours())
                    .qualityScore(event.getQualityScore())
                    .processed(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            mlTrainingEventRepository.save(mlEvent);
            log.info("Saved task completion event to ML training data");

        } catch (Exception e) {
            log.error("Failed to process task completion event: {}", e.getMessage());
        }
    }

    /**
     * Process task assignment event for ML training
     */
    public void processTaskAssignmentEvent(TaskAssignmentEvent event) {
        log.info("Processing task assignment event for task: {}", event.getTaskId());

        try {
            MLTrainingEvent mlEvent = MLTrainingEvent.builder()
                    .taskId(event.getTaskId())
                    .userId(event.getAssignedUserId())
                    .eventType(MLTrainingEvent.EventType.TASK_ASSIGNMENT)
                    .assignmentDate(event.getAssignedAt())
                    .estimatedHours(event.getEstimatedHours())
                    .assignmentMethod(event.getAssignmentMethod())
                    .predictionConfidence(event.getPredictionConfidence())
                    .processed(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            mlTrainingEventRepository.save(mlEvent);
            log.info("Saved task assignment event to ML training data");

        } catch (Exception e) {
            log.error("Failed to process task assignment event: {}", e.getMessage());
        }
    }

    /**
     * Process user profile update event for ML training
     */
    public void processUserProfileUpdateEvent(UserProfileUpdateEvent event) {
        log.info("Processing user profile update event for user: {}", event.getUserId());

        try {
            MLTrainingEvent mlEvent = MLTrainingEvent.builder()
                    .userId(event.getUserId())
                    .eventType(MLTrainingEvent.EventType.USER_ACTIVITY)
                    .processed(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            mlTrainingEventRepository.save(mlEvent);
            log.info("Saved user profile update event to ML training data");

        } catch (Exception e) {
            log.error("Failed to process user profile update event: {}", e.getMessage());
        }
    }

    /**
     * Process generic ML event from JSON
     */
    public void processGenericMLEvent(String eventJson) {
        log.info("Processing generic ML event: {}", eventJson);

        try {
            // Parse generic ML event and save to training data
            MLTrainingEvent mlEvent = MLTrainingEvent.builder()
                    .eventType(MLTrainingEvent.EventType.USER_ACTIVITY)
                    .processed(false)
                    .createdAt(LocalDateTime.now())
                    .build();

            mlTrainingEventRepository.save(mlEvent);
            log.info("Saved generic ML event to training data");

        } catch (Exception e) {
            log.error("Failed to process generic ML event: {}", e.getMessage());
        }
    }
}
