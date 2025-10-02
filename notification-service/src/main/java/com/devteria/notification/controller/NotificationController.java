package com.devteria.notification.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.devteria.notification.dto.request.MarkReadRequest;
import com.devteria.notification.dto.response.NotificationResponse;
import com.devteria.notification.dto.response.NotificationSummaryResponse;
import com.devteria.notification.service.UserNotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final UserNotificationService userNotificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<NotificationSummaryResponse> getUserNotifications(
            @PathVariable("userId") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Getting notifications for user: {}, page: {}, size: {}", userId, page, size);
        NotificationSummaryResponse response = userNotificationService.getUserNotifications(userId, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(@PathVariable String userId) {
        log.info("Getting unread notifications for user: {}", userId);
        List<NotificationResponse> unreadNotifications = userNotificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(unreadNotifications);
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Long> getUnreadCount(@PathVariable String userId) {
        log.info("Getting unread count for user: {}", userId);
        long count = userNotificationService.getUnreadCount(userId);
        return ResponseEntity.ok(count);
    }

    @GetMapping("/user/{userId}/recent")
    public ResponseEntity<List<NotificationResponse>> getRecentNotifications(
            @PathVariable String userId, @RequestParam(defaultValue = "7") int days) {

        log.info("Getting recent notifications for user: {} (last {} days)", userId, days);
        List<NotificationResponse> recentNotifications = userNotificationService.getRecentNotifications(userId, days);
        return ResponseEntity.ok(recentNotifications);
    }

    @PostMapping("/user/{userId}/mark-read")
    public ResponseEntity<Void> markNotificationsAsRead(
            @PathVariable("userId") String userId, @RequestBody MarkReadRequest request) {

        List<String> notificationIds = request.getIds();
        log.info("Marking {} notifications as read for user: {}", notificationIds.size(), userId);
        userNotificationService.markNotificationsAsRead(userId, notificationIds);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/user/{userId}/mark-all-read")
    public ResponseEntity<Void> markAllNotificationsAsRead(@PathVariable String userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        userNotificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.ok().build();
    }
}
