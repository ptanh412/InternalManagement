package com.mnp.project.service;

import com.mnp.project.client.NotificationServiceClient;
import com.mnp.project.dto.request.InternalNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationProducerService {

    private final NotificationServiceClient notificationServiceClient;

    /**
     * Send notification when project manager creates project and adds team lead
     */
    public void sendTeamLeadProjectNotification(String teamLeadId, String projectId,
                                              String projectName, String projectManagerName) {
        try {
            // Generate unique notification ID to prevent duplicates
            String notificationId = UUID.randomUUID().toString();

            log.info("Attempting to send team lead project assignment notification with ID: {} for user: {} and project: {}",
                    notificationId, teamLeadId, projectId);

            // Create notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("projectId", projectId);
            params.put("projectName", projectName);
            params.put("projectManagerName", projectManagerName);
            params.put("scope", "INDIVIDUAL");
            params.put("type", "PROJECT_ASSIGNMENT");
            params.put("notificationId", notificationId); // Add unique ID

            // Save notification in database via HTTP call (this also handles real-time WebSocket notification)
            InternalNotificationRequest notificationRequest = InternalNotificationRequest.builder()
                    .userId(teamLeadId)
                    .type("PROJECT_ASSIGNMENT")
                    .title("New Project Assignment")
                    .message(String.format("You have been assigned as Team Lead for project '%s' by %s",
                            projectName, projectManagerName))
                    .data(params)
                    .channel("WEBSOCKET")
                    .templateCode("TEAM_LEAD_PROJECT_ASSIGNMENT")
                    .realTime(true)
                    .build();

            // Call notification service to save notification in database and send real-time notification
            try {
                notificationServiceClient.sendNotification(notificationRequest);
                log.info("Successfully sent notification with ID: {} for user: {} and project: {}",
                        notificationId, teamLeadId, projectId);
            } catch (Exception e) {
                log.error("Failed to send notification with ID: {} for user: {} and project: {} - Error: {}",
                        notificationId, teamLeadId, projectId, e.getMessage());
                throw e; // Re-throw to be caught by outer catch block
            }

        } catch (Exception e) {
            log.error("Failed to send team lead project assignment notification for user: {} and project: {} - Error: {}",
                    teamLeadId, projectId, e.getMessage());
        }
    }
}
