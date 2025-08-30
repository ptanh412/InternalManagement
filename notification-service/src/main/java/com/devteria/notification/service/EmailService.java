package com.devteria.notification.service;

import com.devteria.event.dto.NotificationEvent;
import com.devteria.notification.dto.request.*;
import com.devteria.notification.dto.response.EmailResponse;
import com.devteria.notification.exception.AppException;
import com.devteria.notification.exception.ErrorCode;
import com.devteria.notification.repository.httpclient.EmailClient;
import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailService {
    EmailClient emailClient;

    @Value("${notification.email.sendgrid-apikey}")
    @NonFinal
    String apiKey;

    public EmailResponse sendEmail(SendEmailRequest request) {
        EmailRequest emailRequest = EmailRequest.builder()
                .from(From.builder()
                        .name("Pham Anh")
                        .email("pham041203theanh@gmail.com")
                        .build())
                .personalizations(List.of(Personalization.builder()
                                .to(List.of(request.getTo()))
                                .subject(request.getSubject())
                        .build()))
                .content(List.of(Content.builder()
                        .type("text/html")
                        .value(request.getContent())
                        .build()))
                .build();
        try {
            String bearerToken = "Bearer " + apiKey;
            return emailClient.sendEmail(bearerToken, emailRequest);
        } catch (FeignException e){
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }

    public void sendEmail(NotificationEvent event) {
        try {
            log.info("Sending email notification to: {}", event.getRecipient());

            Recipient recipient = Recipient.builder()
                    .email(event.getRecipient())
                    .name(event.getRecipientName() != null ? event.getRecipientName() : event.getRecipient())
                    .build();

            // Get email content - prefer direct body field, fallback to param map
            String emailBody = getEmailBody(event);
            String emailSubject = getEmailSubject(event);

            EmailRequest emailRequest = EmailRequest.builder()
                    .from(From.builder()
                            .name("Pham Anh")
                            .email("pham041203theanh@gmail.com")
                            .build())
                    .personalizations(List.of(Personalization.builder()
                                    .to(List.of(recipient))
                                    .subject(emailSubject)
                            .build()))

                    .content(List.of(Content.builder()
                            .type(getContentType(event))
                            .value(formatEmailContent(emailBody))
                            .build()))
                    .build();

            String bearerToken = "Bearer " + apiKey;
            emailClient.sendEmail(bearerToken, emailRequest);
            log.info("Email notification sent successfully to: {}", event.getRecipient());

        } catch (FeignException e) {
            log.error("Failed to send email notification to: {}", event.getRecipient(), e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        } catch (Exception e) {
            log.error("Unexpected error while sending email notification", e);
        }
    }

    private String getEmailBody(NotificationEvent event) {
        // First try to get body from direct field
        if (event.getBody() != null && !event.getBody().trim().isEmpty()) {
            return event.getBody();
        }

        // Fallback to param map if available
        if (event.getParam() != null) {
            Object bodyParam = event.getParam().get("body");
            if (bodyParam != null) {
                return bodyParam.toString();
            }
        }

        // Default fallback
        return "Notification from Management System";
    }

    private String getEmailSubject(NotificationEvent event) {
        // First try to get subject from direct field
        if (event.getSubject() != null && !event.getSubject().trim().isEmpty()) {
            return event.getSubject();
        }

        // Fallback to param map if available
        if (event.getParam() != null) {
            Object subjectParam = event.getParam().get("subject");
            if (subjectParam != null) {
                return subjectParam.toString();
            }
        }

        // Default fallback
        return "Notification from Management System";
    }

    private String getContentType(NotificationEvent event) {
        if (event.getContentType() != null) {
            return event.getContentType();
        }
        return "text/html";
    }

    private String formatEmailContent(String body) {
        if (body == null || body.trim().isEmpty()) {
            return "Notification from Management System";
        }

        // Convert plain text to HTML with proper formatting
        return body.replace("\n", "<br>")
                  .replace("Dear Team Member,", "<h3>Dear Team Member,</h3>")
                  .replace("Best regards,", "<br><br><strong>Best regards,</strong><br>");
    }
}
