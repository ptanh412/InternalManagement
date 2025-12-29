package com.mnp.post.client;

import com.mnp.post.configuration.FeignClientConfiguration;
import lombok.*;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@FeignClient(name = "notification-service", url = "${app.services.notification}", configuration = FeignClientConfiguration.class)
public interface RealTimeNotificationClient {

    @PostMapping("/api/notifications/realtime/department-post")
    void sendDepartmentPostNotification(@RequestBody DepartmentPostNotificationRequest request);

    @PostMapping("/api/notifications/realtime/custom")
    void sendCustomNotification(@RequestBody CustomNotificationRequest request);

    // DTO Classes
    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    class DepartmentPostNotificationRequest {
        private List<String> employeeIds;
        private String postId;
        private String departmentId;
        private String departmentName;
        private String authorName;
        private String postContent;
    }

    @Data
    @Setter
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    class CustomNotificationRequest {
        private String userId;
        private String type;
        private String title;
        private String message;
        private Map<String, Object> additionalData;
    }
}
