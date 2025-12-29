package com.devteria.notification.service;

import java.util.UUID;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.mnp.event.dto.NotificationEvent;
import com.devteria.notification.dto.request.*;
import com.devteria.notification.dto.response.EmailResponse;
import com.devteria.notification.exception.AppException;
import com.devteria.notification.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EmailService {
    JavaMailSender mailSender;

    @Value("${notification.email.from-email}")
    @NonFinal
    String fromEmail;

    @Value("${notification.email.from-name}")
    @NonFinal
    String fromName;

    @Value("${notification.email.enabled:true}")
    @NonFinal
    boolean emailEnabled;

    /**
     * Send email - Public API endpoint
     */
    public EmailResponse sendEmail(SendEmailRequest request) {
        log.info("📧 Sending email to: {}", request.getTo());

        if (!emailEnabled) {
            log.warn("⚠️ Email sending is disabled in configuration");
            return EmailResponse.builder()
                    .messageId("disabled-" + UUID.randomUUID())
                    .status("DISABLED")
                    .recipient(request.getTo())
                    .build();
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set sender
            helper.setFrom(fromEmail, fromName);

            // Set recipient
            helper.setTo(request.getTo());

            // Set subject
            helper.setSubject(request.getSubject());

            // Set content
            String contentType = request.getContentType() != null ? request.getContentType() : "text/html";
            boolean isHtml = "text/html".equalsIgnoreCase(contentType);
            helper.setText(request.getContent(), isHtml);

            // Send email
            mailSender.send(message);

            String messageId = UUID.randomUUID().toString();
            log.info("✅ Email sent successfully to: {} with messageId: {}", request.getTo(), messageId);

            return EmailResponse.builder()
                    .messageId(messageId)
                    .status("SENT")
                    .recipient(request.getTo())
                    .build();

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to: {}", request.getTo(), e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending email to: {}", request.getTo(), e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        }
    }

    /**
     * Send email from Kafka event - Internal use
     */
    public void sendEmailFromEvent(NotificationEvent event) {
        try {
            log.info("📧 Processing email notification event for: {}", event.getRecipient());

            if (!emailEnabled) {
                log.warn("⚠️ Email sending is disabled, skipping event");
                return;
            }

            String emailBody = getEmailBody(event);
            String emailSubject = getEmailSubject(event);
            String contentType = getContentType(event);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // Set sender
            helper.setFrom(fromEmail, fromName);

            // Set recipient
            helper.setTo(event.getRecipient());

            // Set subject
            helper.setSubject(emailSubject);

            // Set content
            boolean isHtml = "text/html".equalsIgnoreCase(contentType);
            helper.setText(emailBody, isHtml);

            // Send email
            mailSender.send(message);

            log.info("✅ Email notification sent successfully to: {}", event.getRecipient());

        } catch (MessagingException e) {
            log.error("❌ Failed to send email notification to: {}", event.getRecipient(), e);
            throw new AppException(ErrorCode.CANNOT_SEND_EMAIL);
        } catch (Exception e) {
            log.error("❌ Unexpected error while sending email notification to: {}", event.getRecipient(), e);
        }
    }

    private String getEmailBody(NotificationEvent event) {
        if (event.getBody() != null && !event.getBody().trim().isEmpty()) {
            return event.getBody();
        }

        if (event.getParam() != null) {
            Object bodyParam = event.getParam().get("body");
            if (bodyParam != null) {
                return bodyParam.toString();
            }
        }

        return "<p>Notification from Management System</p>";
    }

    private String getEmailSubject(NotificationEvent event) {
        if (event.getSubject() != null && !event.getSubject().trim().isEmpty()) {
            return event.getSubject();
        }

        if (event.getParam() != null) {
            Object subjectParam = event.getParam().get("subject");
            if (subjectParam != null) {
                return subjectParam.toString();
            }
        }

        return "Notification from Management System";
    }

    private String getContentType(NotificationEvent event) {
        if (event.getContentType() != null) {
            return event.getContentType();
        }
        return "text/html";
    }

}
