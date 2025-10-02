package com.mnp.chat.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.mnp.chat.client.NotificationServiceClient;
import com.mnp.chat.dto.request.NotificationRequest;
import com.mnp.chat.entity.ParticipantInfo;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatNotificationService {

    NotificationServiceClient notificationServiceClient;

    public void notifyUserAddedToGroup(String groupName, String groupId, ParticipantInfo addedUser, String addedBy) {
        try {
            log.info(
                    "Sending in-system notification to user {} for being added to group: {}",
                    addedUser.getUserId(),
                    groupName);

            // Prepare notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("groupName", groupName);
            params.put("groupId", groupId);
            params.put("addedBy", addedBy);
            params.put("userName", addedUser.getFirstName() + " " + addedUser.getLastName());

            // Prepare additional data for mobile/web apps
            Map<String, String> data = new HashMap<>();
            data.put("type", "CHAT_GROUP_ADDED");
            data.put("group_id", groupId);
            data.put("group_name", groupName);
            data.put("action", "navigate_to_chat");

            // Create WebSocket notification for real-time updates
            NotificationRequest webSocketNotification = NotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(addedUser.getUserId())
                    .recipientName(addedUser.getFirstName() + " " + addedUser.getLastName())
                    .type("CHAT_GROUP_ADDED")
                    .title("Added to Chat Group")
                    .body("You have been added to the chat group: " + groupName)
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification only
            notificationServiceClient.sendWebSocketNotification(webSocketNotification);

            log.info(
                    "In-system notification sent successfully to user {} for group: {}",
                    addedUser.getUserId(),
                    groupName);

        } catch (Exception e) {
            log.error(
                    "Failed to send in-system notification to user {} for group {}: {}",
                    addedUser.getUserId(),
                    groupName,
                    e.getMessage());
            // Don't throw exception to avoid breaking the main chat group creation flow
        }
    }

    public void notifyUserAddedToProjectGroup(
            String projectName,
            String projectId,
            String groupId,
            ParticipantInfo addedUser,
            String projectManagerName) {
        try {
            log.info(
                    "Sending project group notification to user {} for project: {}",
                    addedUser.getUserId(),
                    projectName);

            // Prepare notification parameters
            Map<String, Object> params = new HashMap<>();
            params.put("projectName", projectName);
            params.put("projectId", projectId);
            params.put("groupId", groupId);
            params.put("projectManager", projectManagerName);
            params.put("userName", addedUser.getFirstName() + " " + addedUser.getLastName());

            // Prepare additional data for mobile/web apps
            Map<String, String> data = new HashMap<>();
            data.put("type", "PROJECT_CHAT_GROUP_ADDED");
            data.put("project_id", projectId);
            data.put("group_id", groupId);
            data.put("project_name", projectName);
            data.put("action", "navigate_to_project_chat");

            // Create WebSocket notification for real-time updates
            NotificationRequest webSocketNotification = NotificationRequest.builder()
                    .channel("WEBSOCKET")
                    .recipient(addedUser.getUserId())
                    .recipientName(addedUser.getFirstName() + " " + addedUser.getLastName())
                    .type("PROJECT_CHAT_GROUP_ADDED")
                    .title("Added to Project Chat")
                    .body("You have been added to the project chat for: " + projectName)
                    .param(params)
                    .data(data)
                    .contentType("text/plain")
                    .build();

            // Send WebSocket notification only
            notificationServiceClient.sendWebSocketNotification(webSocketNotification);

            log.info(
                    "Project group notification sent successfully to user {} for project: {}",
                    addedUser.getUserId(),
                    projectName);

        } catch (Exception e) {
            log.error(
                    "Failed to send project group notification to user {} for project {}: {}",
                    addedUser.getUserId(),
                    projectName,
                    e.getMessage());
            // Don't throw exception to avoid breaking the main flow
        }
    }
}
