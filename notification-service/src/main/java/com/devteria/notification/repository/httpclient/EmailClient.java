package com.devteria.notification.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;

import com.devteria.notification.dto.request.EmailRequest;
import com.devteria.notification.dto.response.EmailResponse;

@FeignClient(name = "email-client", url = "${notification.email.sendgrid-url}")
public interface EmailClient {
    @PostMapping(value = "/v3/mail/send", produces = MediaType.APPLICATION_JSON_VALUE)
    EmailResponse sendEmail(@RequestHeader("Authorization") String bearerToken, @RequestBody EmailRequest body);
}
