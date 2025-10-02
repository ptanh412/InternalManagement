package com.mnp.chat.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mnp.chat.dto.ApiResponse;
import com.mnp.chat.dto.request.NotificationRequest;

@FeignClient(name = "notification-service", url = "${app.services.notification.url}")
public interface NotificationServiceClient {

    @PostMapping("/notifications/send")
    ApiResponse<String> sendNotification(@RequestBody NotificationRequest request);

    @PostMapping("/notifications/websocket")
    ApiResponse<String> sendWebSocketNotification(@RequestBody NotificationRequest request);
}
