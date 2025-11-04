package com.mnp.project.service;

import com.corundumstudio.socketio.SocketIOServer;
import com.mnp.project.dto.response.ProjectResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocketIOService implements ApplicationRunner {

    private final SocketIOServer server;

    @Override
    public void run(ApplicationArguments args) {
        server.start();
        log.info("SocketIO server started successfully on port: {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            log.info("SocketIO server stopped");
        }
    }

    /**
     * Send project creation notification to team leads
     */
    public void notifyProjectCreated(ProjectResponse project) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "PROJECT_CREATED");
            notification.put("message", "New project has been created: " + project.getName());
            notification.put("project", project);
            notification.put("timestamp", System.currentTimeMillis());

            // Send to all connected clients (team leads)
            server.getBroadcastOperations().sendEvent("project-created", notification);

            log.info("Sent project creation notification for project: {} to all connected team leads",
                    project.getName());
        } catch (Exception e) {
            log.error("Failed to send project creation notification for project: {}",
                    project.getName(), e);
        }
    }

    /**
     * Send project update notification to team leads
     */
    public void notifyProjectUpdated(ProjectResponse project) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "PROJECT_UPDATED");
            notification.put("message", "Project has been updated: " + project.getName());
            notification.put("project", project);
            notification.put("timestamp", System.currentTimeMillis());

            server.getBroadcastOperations().sendEvent("project-updated", notification);

            log.info("Sent project update notification for project: {} to all connected team leads",
                    project.getName());
        } catch (Exception e) {
            log.error("Failed to send project update notification for project: {}",
                    project.getName(), e);
        }
    }

    /**
     * Send project status change notification
     */
    public void notifyProjectStatusChanged(ProjectResponse project) {
        try {
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "PROJECT_STATUS_CHANGED");
            notification.put("message", "Project status changed to " + project.getStatus() + ": " + project.getName());
            notification.put("project", project);
            notification.put("timestamp", System.currentTimeMillis());

            server.getBroadcastOperations().sendEvent("project-status-changed", notification);

            log.info("Sent project status change notification for project: {} to all connected team leads",
                    project.getName());
        } catch (Exception e) {
            log.error("Failed to send project status change notification for project: {}",
                    project.getName(), e);
        }
    }

    /**
     * Send custom notification to specific room or all clients
     */
    public void sendNotification(String event, Object data, String room) {
        try {
            if (room != null && !room.isEmpty()) {
                server.getRoomOperations(room).sendEvent(event, data);
                log.info("Sent notification to room {}: {}", room, event);
            } else {
                server.getBroadcastOperations().sendEvent(event, data);
                log.info("Sent broadcast notification: {}", event);
            }
        } catch (Exception e) {
            log.error("Failed to send notification: {}", event, e);
        }
    }
}
