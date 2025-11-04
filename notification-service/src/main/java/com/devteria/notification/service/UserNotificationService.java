package com.devteria.notification.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devteria.notification.dto.response.NotificationResponse;
import com.devteria.notification.dto.response.NotificationSummaryResponse;
import com.devteria.notification.entity.UserNotification;
import com.devteria.notification.repository.UserNotificationRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserNotificationService {

    private final UserNotificationRepository notificationRepository;

    @Transactional
    public UserNotification saveNotification(
            String userId,
            String type,
            String title,
            String message,
            Map<String, Object> data,
            String channel,
            String templateCode) {

        // Check for duplicates for project-related notifications
        if (data != null && data.containsKey("projectId")) {
            String projectId = data.get("projectId").toString();

            // Check for recent notifications (within last 5 minutes) for the same user, type, and project
            LocalDateTime recentThreshold = LocalDateTime.now().minusMinutes(5);
            List<UserNotification> recentNotifications = notificationRepository
                    .findRecentNotificationsByUserTypeAndProject(userId, type, projectId, recentThreshold);

            if (!recentNotifications.isEmpty()) {
                log.warn("Duplicate notification prevented for user: {}, type: {}, project: {} - found {} recent similar notifications",
                        userId, type, projectId, recentNotifications.size());
                // Return the most recent existing notification instead of creating a duplicate
                return recentNotifications.get(0);
            }
        }

        // Convert data map to string map for JPA storage
        Map<String, String> stringData = new HashMap<>();
        if (data != null) {
            data.forEach((key, value) -> stringData.put(key, value != null ? value.toString() : null));
        }

        UserNotification notification = UserNotification.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .data(stringData)
                .channel(channel)
                .templateCode(templateCode)
                .isRead(false)
                .createdAt(java.time.LocalDateTime.now())
                .build();

        UserNotification savedNotification = notificationRepository.save(notification);
        log.info("Saved notification for user: {} with type: {}", userId, type);

        return savedNotification;
    }

    public NotificationSummaryResponse getUserNotifications(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<UserNotification> notificationPage =
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        List<NotificationResponse> notifications = notificationPage.getContent().stream()
                .map(this::mapToNotificationResponse)
                .toList();

        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);

        return NotificationSummaryResponse.builder()
                .notifications(notifications)
                .unreadCount(unreadCount)
                .totalPages(notificationPage.getTotalPages())
                .totalElements(notificationPage.getTotalElements())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    public List<NotificationResponse> getUnreadNotifications(String userId) {
        List<UserNotification> unreadNotifications =
                notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return unreadNotifications.stream().map(this::mapToNotificationResponse).toList();
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markNotificationsAsRead(String userId, List<String> notificationIds) {
        if (notificationIds != null && !notificationIds.isEmpty()) {
            notificationRepository.markAsRead(notificationIds, LocalDateTime.now());
            log.info("Marked {} notifications as read for user: {}", notificationIds.size(), userId);
        }
    }

    @Transactional
    public void markAllNotificationsAsRead(String userId) {
        notificationRepository.markAllAsReadForUser(userId, LocalDateTime.now());
        log.info("Marked all notifications as read for user: {}", userId);
    }

    public List<NotificationResponse> getRecentNotifications(String userId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<UserNotification> recentNotifications =
                notificationRepository.findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(userId, since);
        return recentNotifications.stream().map(this::mapToNotificationResponse).toList();
    }

    private NotificationResponse mapToNotificationResponse(UserNotification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .data(notification.getData())
                .isRead(notification.getIsRead())
                .channel(notification.getChannel())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .build();
    }
}
