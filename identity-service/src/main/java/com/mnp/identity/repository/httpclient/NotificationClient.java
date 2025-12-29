package com.mnp.identity.repository.httpclient;

import com.mnp.identity.configuration.AuthenticationRequestInterceptor;
import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.SendEmailRequest;
import com.mnp.identity.dto.response.EmailResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
        name = "notification-service",
        url = "${app.services.notification}",
        configuration = {AuthenticationRequestInterceptor.class})
public interface NotificationClient {
    @PostMapping("/email/send")
    ApiResponse<EmailResponse> sendEmail(@RequestBody SendEmailRequest request);
}
