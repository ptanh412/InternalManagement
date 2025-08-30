package com.devteria.identity.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.devteria.event.dto.NotificationEvent;
import com.devteria.identity.dto.event.BusinessRoleChangeEvent;
import com.devteria.identity.entity.User;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BusinessRoleNotificationService {

    UserRepository userRepository;
    KafkaTemplate<String, Object> kafkaTemplate;

    public void sendBusinessRoleChangeNotification(BusinessRoleChangeEvent event) {
        log.info(
                "Processing business role change notification for user: {} with role: {}",
                event.getUsername(),
                event.getNewRole());

        switch (event.getNewRole()) {
            case DIRECTOR, SECRETARY -> sendNotificationToAll(event);
            case HEADER_DEPARTMENT, DEPUTY_DEPARTMENT -> sendNotificationToDepartmentMembers(event);
            default -> log.info("No notification required for role: {}", event.getNewRole());
        }
    }

    private void sendNotificationToAll(BusinessRoleChangeEvent event) {
        log.info("Sending notification to all users for {} role change", event.getNewRole());

        List<User> allUsers = userRepository.findAllActiveUsers();

        for (User user : allUsers) {
            if (!user.getId().equals(event.getUserId())) { // Don't notify the user themselves
                sendNotificationToUser(user, event, "ALL_COMPANY");
            }
        }
    }

    private void sendNotificationToDepartmentMembers(BusinessRoleChangeEvent event) {
        if (event.getDepartmentId() == null) {
            log.warn("Department ID is null for department role notification");
            return;
        }

        log.info(
                "Sending notification to department {} members for {} role change",
                event.getDepartmentName(),
                event.getNewRole());

        List<User> departmentMembers = userRepository.findByDepartmentId(event.getDepartmentId());

        for (User user : departmentMembers) {
            if (!user.getId().equals(event.getUserId())) { // Don't notify the user themselves
                sendNotificationToUser(user, event, "DEPARTMENT");
            }
        }
    }

    private void sendNotificationToUser(User recipient, BusinessRoleChangeEvent event, String scope) {
        // Create email notification
        NotificationEvent emailNotification = createEmailNotification(recipient, event, scope);
        kafkaTemplate.send("notification-delivery", emailNotification);

        // Create WebSocket notification
        NotificationEvent webSocketNotification = createWebSocketNotification(recipient, event, scope);
        kafkaTemplate.send("websocket-notification", webSocketNotification);
    }

    private NotificationEvent createEmailNotification(User recipient, BusinessRoleChangeEvent event, String scope) {
        Map<String, Object> params = new HashMap<>();
        params.put("recipientName", recipient.getFirstName() + " " + recipient.getLastName());
        params.put("changedUserName", event.getFirstName() + " " + event.getLastName());
        params.put("newRole", event.getNewRole().getDisplayName());
        params.put("oldRole", event.getOldRole() != null ? event.getOldRole().getDisplayName() : "None");
        params.put("departmentName", event.getDepartmentName());
        params.put("eventType", event.getEventType());
        params.put("scope", scope);

        String subject = createEmailSubject(event, scope);
        String body = createRoleChangeEmailHtml(recipient.getFirstName(), event, scope);

        return NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(recipient.getEmail())
                .templateCode("BUSINESS_ROLE_CHANGE")
                .param(params)
                .subject(subject)
                .body(body)
                .contentType("text/html")
                .build();
    }

    private NotificationEvent createWebSocketNotification(User recipient, BusinessRoleChangeEvent event, String scope) {
        Map<String, Object> params = new HashMap<>();
        params.put("type", "BUSINESS_ROLE_CHANGE");
        params.put("userId", event.getUserId());
        params.put("username", event.getUsername());
        params.put("changedUserName", event.getFirstName() + " " + event.getLastName());
        params.put("newRole", event.getNewRole().getDisplayName());
        params.put("oldRole", event.getOldRole() != null ? event.getOldRole().getDisplayName() : "None");
        params.put("departmentName", event.getDepartmentName());
        params.put("eventType", event.getEventType());
        params.put("scope", scope);
        // Always use ISO 8601 string for timestamp
        params.put(
                "timestamp", event.getTimestamp() != null ? event.getTimestamp().toString() : null);

        return NotificationEvent.builder()
                .channel("WEBSOCKET")
                .recipient(recipient.getId()) // Use user ID for WebSocket targeting
                .templateCode("BUSINESS_ROLE_CHANGE_REALTIME")
                .param(params)
                .build();
    }

    private String createEmailSubject(BusinessRoleChangeEvent event, String scope) {
        String roleText = event.getNewRole().getDisplayName();
        String scopeText = "ALL_COMPANY".equals(scope) ? "Company-wide" : "Department";

        return String.format(
                "[%s Update] %s %s has been assigned as %s",
                scopeText, event.getFirstName(), event.getLastName(), roleText);
    }

    private String createEmailBody(BusinessRoleChangeEvent event, String scope) {
        StringBuilder body = new StringBuilder();
        body.append("Dear Team Member,\n\n");

        if ("ALL_COMPANY".equals(scope)) {
            body.append("We would like to inform you of an important organizational change:\n\n");
        } else {
            body.append(String.format(
                    "We would like to inform you of an important change in the %s department:\n\n",
                    event.getDepartmentName()));
        }

        body.append(String.format(
                "%s %s has been assigned the role of %s",
                event.getFirstName(), event.getLastName(), event.getNewRole().getDisplayName()));

        if (event.getDepartmentName() != null) {
            body.append(String.format(" in the %s department", event.getDepartmentName()));
        }

        body.append(".\n\n");

        if (event.getOldRole() != null) {
            body.append(String.format("Previous role: %s\n", event.getOldRole().getDisplayName()));
        }

        body.append("New role: ").append(event.getNewRole().getDisplayName()).append("\n");
        body.append("Effective immediately.\n\n");
        body.append("Best regards,\nBookteria Management System");

        return body.toString();
    }

    private String createRoleChangeEmailHtml(String recipientName, BusinessRoleChangeEvent event, String scope) {
        String scopeText = "ALL_COMPANY".equals(scope) ? "Company-wide" : "Department";
        String oldRoleText = event.getOldRole() != null ? event.getOldRole().getDisplayName() : "None";

        return String.format(
                """
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Role Change Notification</title>
				<style>
					* {
						margin: 0;
						padding: 0;
						box-sizing: border-box;
					}

					body {
						font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
						line-height: 1.6;
						color: #333;
						background-color: #f4f4f4;
					}

					.email-container {
						max-width: 600px;
						margin: 0 auto;
						background-color: #ffffff;
						border-radius: 10px;
						overflow: hidden;
						box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
					}

					.header {
						background: linear-gradient(135deg, #ff6b6b 0%%, #ee5a24 100%%);
						color: white;
						padding: 30px;
						text-align: center;
					}

					.header h1 {
						font-size: 28px;
						margin-bottom: 10px;
						font-weight: 600;
					}

					.header p {
						font-size: 16px;
						opacity: 0.9;
					}

					.content {
						padding: 40px 30px;
					}

					.greeting {
						font-size: 18px;
						color: #2c3e50;
						margin-bottom: 30px;
						line-height: 1.8;
					}

					.change-notification {
						background-color: #fff5f5;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						border-left: 4px solid #ff6b6b;
					}

					.change-notification h3 {
						color: #c53030;
						margin-bottom: 15px;
						font-size: 20px;
					}

					.role-details {
						background-color: #f8f9fa;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						border-left: 4px solid #4299e1;
					}

					.detail-row {
						display: flex;
						justify-content: space-between;
						align-items: center;
						padding: 12px 0;
						border-bottom: 1px solid #e9ecef;
					}

					.detail-row:last-child {
						border-bottom: none;
					}

					.detail-label {
						font-weight: 600;
						color: #495057;
						min-width: 120px;
					}

					.detail-value {
						color: #2c3e50;
						font-weight: 500;
					}

					.role-badge {
						background: linear-gradient(135deg, #4299e1 0%%, #3182ce 100%%);
						color: white;
						padding: 6px 12px;
						border-radius: 20px;
						font-size: 12px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.5px;
					}

					.old-role-badge {
						background: linear-gradient(135deg, #a0aec0 0%%, #718096 100%%);
						color: white;
						padding: 6px 12px;
						border-radius: 20px;
						font-size: 12px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.5px;
					}

					.effective-notice {
						background-color: #e6fffa;
						border-radius: 8px;
						padding: 20px;
						margin: 25px 0;
						text-align: center;
						border-left: 4px solid #38b2ac;
					}

					.effective-notice h4 {
						color: #2c7a7b;
						margin-bottom: 10px;
						font-size: 16px;
					}

					.footer {
						background-color: #2c3e50;
						color: white;
						padding: 25px 30px;
						text-align: center;
					}

					.footer p {
						margin-bottom: 10px;
						opacity: 0.9;
					}

					.footer .signature {
						font-weight: 600;
						color: #ff6b6b;
					}

					.company-info {
						margin-top: 15px;
						padding-top: 15px;
						border-top: 1px solid #34495e;
						font-size: 12px;
						opacity: 0.7;
					}

					@media (max-width: 600px) {
						.email-container {
							margin: 10px;
							border-radius: 5px;
						}

						.header, .content, .footer {
							padding: 20px;
						}

						.detail-row {
							flex-direction: column;
							align-items: flex-start;
							gap: 5px;
						}

						.detail-label {
							min-width: auto;
						}
					}
				</style>
			</head>
			<body>
				<div class="email-container">
					<div class="header">
						<h1>👥 Role Change Notification</h1>
						<p>%s organizational update</p>
					</div>

					<div class="content">
						<div class="greeting">
							Dear <strong>%s</strong>,<br><br>
							We would like to inform you of an important organizational change that affects our team structure.
						</div>

						<div class="change-notification">
							<h3>🔄 Role Assignment Update</h3>
							<p><strong>%s %s</strong> has been assigned the role of <strong>%s</strong>%s.</p>
						</div>

						<div class="role-details">
							<div class="detail-row">
								<span class="detail-label">Employee:</span>
								<span class="detail-value">%s %s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Previous Role:</span>
								<span class="old-role-badge">%s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">New Role:</span>
								<span class="role-badge">%s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Department:</span>
								<span class="detail-value">%s</span>
							</div>
						</div>

						<div class="effective-notice">
							<h4>⚡ Effective Immediately</h4>
							<p>This role change is effective immediately and all team members should be aware of this organizational update.</p>
						</div>

						<div style="margin-top: 30px; padding: 20px; background-color: #fef5e7; border-radius: 8px; border-left: 4px solid #f39c12;">
							<h4 style="color: #d68910; margin-bottom: 10px;">💼 What This Means:</h4>
							<ul style="color: #d68910; margin-left: 20px;">
								<li>Updated reporting structure</li>
								<li>New responsibilities and permissions</li>
								<li>Potential changes in workflow processes</li>
								<li>Updated team collaboration dynamics</li>
							</ul>
						</div>
					</div>

					<div class="footer">
						<p>If you have any questions about this organizational change, please reach out to your manager or HR department.</p>
						<p class="signature">Best regards,<br>Bookteria Management System</p>
						<div class="company-info">
							<p>Bookteria Management System</p>
							<p>Empowering teams, driving success</p>
						</div>
					</div>
				</div>
			</body>
			</html>
			""",
                scopeText,
                recipientName,
                event.getFirstName(),
                event.getLastName(),
                event.getNewRole().getDisplayName(),
                event.getDepartmentName() != null ? " in the " + event.getDepartmentName() + " department" : "",
                event.getFirstName(),
                event.getLastName(),
                oldRoleText,
                event.getNewRole().getDisplayName(),
                event.getDepartmentName() != null ? event.getDepartmentName() : "Not specified");
    }
}
