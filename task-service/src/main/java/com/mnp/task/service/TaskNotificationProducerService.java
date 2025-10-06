package com.mnp.task.service;

import com.mnp.event.dto.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskNotificationProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Send notification when task is assigned to employee
     */
    public void sendTaskAssignmentNotification(String employeeId, String taskId, String taskTitle,
                                             String projectName, String assignedByName, String dueDate) {
        try {
            // Create notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("taskId", taskId);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName);
            params.put("assignedByName", assignedByName);
            params.put("dueDate", dueDate);
            params.put("scope", "INDIVIDUAL");
            params.put("type", "TASK_ASSIGNMENT");

            // Create WebSocket notification event
            NotificationEvent webSocketEvent = NotificationEvent.builder()
                    .channel("WEBSOCKET")
                    .recipient(employeeId)
                    .templateCode("TASK_ASSIGNMENT")
                    .subject("New Task Assignment")
                    .body(String.format("You have been assigned a new task: '%s' in project '%s'",
                            taskTitle, projectName))
                    .param(params)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            kafkaTemplate.send("websocket-notification", webSocketEvent);

            // Create email notification event
            NotificationEvent emailEvent = NotificationEvent.builder()
                    .channel("EMAIL")
                    .recipient(employeeId)
                    .templateCode("TASK_ASSIGNMENT_EMAIL")
                    .subject("New Task Assignment - " + taskTitle)
                    .body(String.format("Dear Employee,\n\nYou have been assigned a new task:\n\nTask: %s\nProject: %s\nAssigned by: %s\nDue Date: %s\n\nPlease check your employee dashboard to view the task details and get started.\n\nBest regards,\nProject Management Team",
                            taskTitle, projectName, assignedByName, dueDate))
                    .param(params)
                    .contentType("text/html")
                    .build();

            // Send email notification
            kafkaTemplate.send("notification-delivery", emailEvent);

            log.info("Sent task assignment notifications for employee: {} and task: {}", employeeId, taskId);

        } catch (Exception e) {
            log.error("Failed to send task assignment notifications", e);
        }
    }

    /**
     * Send task reminder notification
     */
    public void sendTaskReminderNotification(String employeeId, String taskId, String taskTitle,
                                           String projectName, String dueDate) {
        try {
            // Create notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("taskId", taskId);
            params.put("taskTitle", taskTitle);
            params.put("projectName", projectName);
            params.put("dueDate", dueDate);
            params.put("scope", "INDIVIDUAL");
            params.put("type", "TASK_REMINDER");

            // Create WebSocket notification event
            NotificationEvent webSocketEvent = NotificationEvent.builder()
                    .channel("WEBSOCKET")
                    .recipient(employeeId)
                    .templateCode("TASK_REMINDER")
                    .subject("Task Reminder")
                    .body(String.format("Reminder: Task '%s' in project '%s' is due on %s",
                            taskTitle, projectName, dueDate))
                    .param(params)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            kafkaTemplate.send("websocket-notification", webSocketEvent);

            log.info("Sent task reminder notification for employee: {} and task: {}", employeeId, taskId);

        } catch (Exception e) {
            log.error("Failed to send task reminder notifications", e);
        }
    }
}
