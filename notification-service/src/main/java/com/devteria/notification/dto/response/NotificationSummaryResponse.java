package com.devteria.notification.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class NotificationSummaryResponse {
    List<NotificationResponse> notifications;
    long unreadCount;
    int totalPages;
    long totalElements;
    int currentPage;
    int pageSize;
}
