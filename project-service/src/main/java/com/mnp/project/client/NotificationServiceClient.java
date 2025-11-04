package com.mnp.project.client;

import com.mnp.project.configuration.FeignClientConfiguration;
import com.mnp.project.dto.response.ApiResponse;
import com.mnp.project.dto.request.InternalNotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", url = "${app.services.notification}", configuration = FeignClientConfiguration.class)
public interface NotificationServiceClient {

    @PostMapping(value = "/internal/notifications/send",
                 consumes = "application/json",
                 produces = "application/json")
    ApiResponse<Object> sendNotification(@RequestBody InternalNotificationRequest request);
}
