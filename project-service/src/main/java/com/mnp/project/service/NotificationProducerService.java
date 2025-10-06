package com.mnp.project.service;

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
public class NotificationProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Send notification when project manager creates project and adds team lead
     */
    public void sendTeamLeadProjectNotification(String teamLeadId, String projectId,
                                              String projectName, String projectManagerName) {
        try {
            // Create notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("projectId", projectId);
            params.put("projectName", projectName);
            params.put("projectManagerName", projectManagerName);
            params.put("scope", "INDIVIDUAL");
            params.put("type", "PROJECT_ASSIGNMENT");

            // Create WebSocket notification event
            NotificationEvent webSocketEvent = NotificationEvent.builder()
                    .channel("WEBSOCKET")
                    .recipient(teamLeadId)
                    .templateCode("TEAM_LEAD_PROJECT_ASSIGNMENT")
                    .subject("New Project Assignment")
                    .body(String.format("You have been assigned as Team Lead for project '%s' by %s",
                            projectName, projectManagerName))
                    .param(params)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification
            kafkaTemplate.send("websocket-notification", webSocketEvent);

            // Create email notification event
            NotificationEvent emailEvent = NotificationEvent.builder()
                    .channel("EMAIL")
                    .recipient(teamLeadId)
                    .templateCode("TEAM_LEAD_PROJECT_ASSIGNMENT_EMAIL")
                    .subject("New Project Assignment - " + projectName)
                    .body(String.format("Dear Team Lead,\n\nYou have been assigned as Team Lead for project '%s' by %s.\n\nPlease check your dashboard for more details.\n\nBest regards,\nProject Management Team",
                            projectName, projectManagerName))
                    .param(params)
                    .contentType("text/html")
                    .build();

            // Send email notification
            kafkaTemplate.send("notification-delivery", emailEvent);

            log.info("Sent team lead project assignment notifications for user: {} and project: {}", teamLeadId, projectId);

        } catch (Exception e) {
            log.error("Failed to send team lead project assignment notifications", e);
        }
    }
}
