package com.internalmanagement.mlservice.messaging.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internalmanagement.mlservice.entity.MLTrainingEvent;
import com.internalmanagement.mlservice.messaging.events.TaskCompletionEvent;
import com.internalmanagement.mlservice.messaging.events.TaskAssignmentEvent;
import com.internalmanagement.mlservice.messaging.events.UserProfileUpdateEvent;
import com.internalmanagement.mlservice.service.MLDataCollectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for ML training events
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class MLEventConsumer {

    private final MLDataCollectionService mlDataCollectionService;
    private final ObjectMapper objectMapper;

    /**
     * Consume task completion events
     */
    @KafkaListener(topics = "${app.kafka.topics.task-completed}", groupId = "${app.kafka.consumer.group-id}")
    public void handleTaskCompletionEvent(
            @Payload String eventJson,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {
        
        log.info("Received task completion event from topic: {}, partition: {}, offset: {}", 
                topic, partition, offset);
        
        try {
            TaskCompletionEvent event = objectMapper.readValue(eventJson, TaskCompletionEvent.class);
            
            log.info("Processing task completion event for task: {}", event.getTaskId());
            
            // Process the event for ML training
            mlDataCollectionService.processTaskCompletionEvent(event);
            
            // Acknowledge message processing
            acknowledgment.acknowledge();
            
            log.info("Successfully processed task completion event for task: {}", event.getTaskId());
            
        } catch (Exception e) {
            log.error("Failed to process task completion event: {}", e.getMessage(), e);
            
            // In production, you might want to send to DLQ (Dead Letter Queue)
            // For now, we'll acknowledge to avoid infinite retries
            acknowledgment.acknowledge();
        }
    }

    /**
     * Consume task assignment events
     */
    @KafkaListener(topics = "${app.kafka.topics.task-assigned}", groupId = "${app.kafka.consumer.group-id}")
    public void handleTaskAssignmentEvent(
            @Payload String eventJson,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {
        
        log.info("Received task assignment event from topic: {}, partition: {}, offset: {}", 
                topic, partition, offset);
        
        try {
            TaskAssignmentEvent event = objectMapper.readValue(eventJson, TaskAssignmentEvent.class);
            
            log.info("Processing task assignment event for task: {} and user: {}", 
                    event.getTaskId(), event.getUserId());
            
            // Process the event for ML training
            mlDataCollectionService.processTaskAssignmentEvent(event);
            
            // Acknowledge message processing
            acknowledgment.acknowledge();
            
            log.info("Successfully processed task assignment event for task: {}", event.getTaskId());
            
        } catch (Exception e) {
            log.error("Failed to process task assignment event: {}", e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }

    /**
     * Consume user profile update events
     */
    @KafkaListener(topics = "${app.kafka.topics.user-profile-updated}", groupId = "${app.kafka.consumer.group-id}")
    public void handleUserProfileUpdateEvent(
            @Payload String eventJson,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {
        
        log.info("Received user profile update event from topic: {}, partition: {}, offset: {}", 
                topic, partition, offset);
        
        try {
            UserProfileUpdateEvent event = objectMapper.readValue(eventJson, UserProfileUpdateEvent.class);
            
            log.info("Processing user profile update event for user: {}, type: {}", 
                    event.getUserId(), event.getEventType());
            
            // Process the event for ML training
            mlDataCollectionService.processUserProfileUpdateEvent(event);
            
            // Acknowledge message processing
            acknowledgment.acknowledge();
            
            log.info("Successfully processed user profile update event for user: {}", event.getUserId());
            
        } catch (Exception e) {
            log.error("Failed to process user profile update event: {}", e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }

    /**
     * Generic ML events consumer (for other events)
     */
    @KafkaListener(topics = "${app.kafka.topics.ml-events}", groupId = "${app.kafka.consumer.group-id}")
    public void handleMLEvent(
            @Payload String eventJson,
            @Header(KafkaHeaders.RECEIVED_TOPIC) String topic,
            @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
            @Header(KafkaHeaders.OFFSET) long offset,
            Acknowledgment acknowledgment) {
        
        log.info("Received ML event from topic: {}, partition: {}, offset: {}", 
                topic, partition, offset);
        
        try {
            // Generic ML event processing
            mlDataCollectionService.processGenericMLEvent(eventJson);
            
            acknowledgment.acknowledge();
            
            log.info("Successfully processed generic ML event");
            
        } catch (Exception e) {
            log.error("Failed to process generic ML event: {}", e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }
}