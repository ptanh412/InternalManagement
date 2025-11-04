package com.devteria.notification.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import com.devteria.notification.entity.UserNotification;

@Repository
public interface UserNotificationRepository extends MongoRepository<UserNotification, String> {

    // Find notifications for a specific user with pagination
    Page<UserNotification> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    // Find unread notifications for a user
    List<UserNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);

    // Count unread notifications for a user
    long countByUserIdAndIsReadFalse(String userId);

    // Mark all notifications as read for a user
    @Query("{ 'userId': ?0, 'isRead': false }")
    @Update("{ '$set': { 'isRead': true, 'readAt': ?1 } }")
    void markAllAsReadForUser(String userId, LocalDateTime readAt);

    // Mark specific notifications as read
    @Query("{ '_id': { '$in': ?0 } }")
    @Update("{ '$set': { 'isRead': true, 'readAt': ?1 } }")
    void markAsRead(List<String> notificationIds, LocalDateTime readAt);

    // Delete old notifications (older than specified days)
    void deleteByCreatedAtBefore(LocalDateTime cutoffDate);

    // Get recent notifications for a user (last N days)
    List<UserNotification> findByUserIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(
            String userId, LocalDateTime since);

    // Check for duplicate notifications based on user, type, and project data
    @Query("{ 'userId': ?0, 'type': ?1, 'data.projectId': ?2, 'createdAt': { '$gte': ?3 } }")
    List<UserNotification> findRecentNotificationsByUserTypeAndProject(
            String userId, String type, String projectId, LocalDateTime since);
}
