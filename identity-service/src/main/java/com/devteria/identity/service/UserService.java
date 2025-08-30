package com.devteria.identity.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

import com.devteria.identity.dto.request.UserStatusUpdateRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.devteria.event.dto.NotificationEvent;
import com.devteria.identity.dto.event.BusinessRoleChangeEvent;
import com.devteria.identity.dto.request.UserCreationRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.Department;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.ProfileMapper;
import com.devteria.identity.mapper.UserMapper;
import com.devteria.identity.repository.DepartmentRepository;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;
import com.devteria.identity.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserService {
    UserRepository userRepository;
    RoleRepository roleRepository;
    DepartmentRepository departmentRepository;
    UserMapper userMapper;
    ProfileMapper profileMapper;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    KafkaTemplate<String, Object> kafkaTemplate;
    BusinessAuthorizationService businessAuthorizationService;
    BusinessRoleNotificationService businessRoleNotificationService;
    // Check if MEMBER role exists in the role table

    public void updateUserStatus(String userId, UserStatusUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (request.getOnline() != null) {
            user.setOnline(request.getOnline());
        }
        if (request.getLastLogin() != null) {
            user.setLastLogin(request.getLastLogin());
        }
        userRepository.save(user);
    }

    private List<String> mapBusinessRoleToSystemRoles(BusinessRole businessRole) {
        switch (businessRole) {
            case MEMBER:
                return List.of("MEMBER"); // MEMBER business role maps to MEMBER system role
            case ADMINISTRATION:
                return List.of("ADMIN");
            case DIRECTOR:
                return List.of("DIRECTOR");
            case SECRETARY:
                return List.of("SECRETARY");
            case HEADER_DEPARTMENT:
                return List.of("HEADER_DEPARTMENT");
            case DEPUTY_DEPARTMENT:
                return List.of("DEPUTY_DEPARTMENT");
            case LEADER_PROJECT:
                return List.of("LEADER_PROJECT");
            case DEPUTY_PROJECT:
                return List.of("DEPUTY_PROJECT");
            default:
                return List.of();
        }
    }

    public UserResponse createUser(UserCreationRequest request) {
        log.info("createUser called with businessRole: {}", request.getBusinessRole());
        boolean exists = roleRepository.findById("MEMBER").isPresent();
        if (exists) {
            log.info("MEMBER role exists in the role table.");
        } else {
            log.error("MEMBER role does NOT exist in the role table! Please add it to avoid user creation issues.");
        }
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        HashSet<Role> roles = new HashSet<>();
        // Always assign MEMBER role if business role is MEMBER
        if (request.getBusinessRole() != null
                && request.getBusinessRole().name().equals("MEMBER")) {
            log.info("Business role is MEMBER, assigning MEMBER system role.");
            roleRepository
                    .findById("MEMBER")
                    .ifPresentOrElse(roles::add, () -> log.error("MEMBER role not found in roleRepository!"));
        } else if (request.getBusinessRole() != null) {
            for (String systemRoleName : mapBusinessRoleToSystemRoles(request.getBusinessRole())) {
                log.info(
                        "Trying to assign system role: {} for business role: {}",
                        systemRoleName,
                        request.getBusinessRole());
                roleRepository.findById(systemRoleName).ifPresent(roles::add);
            }
        }
        log.info(
                "Roles assigned during user creation: {}",
                roles.stream().map(Role::getName).toList());
        user.setRoles(roles);
        user.setEmailVerified(false);

        // Handle department assignment
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
            user.setDepartment(department);
        }

        // Handle business role assignment
        BusinessRole assignedBusinessRole = null;
        if (request.getBusinessRole() != null) {
            // Check if current user has authority to assign this business role
            businessAuthorizationService.checkBusinessRoleAssignmentAuthority(request.getBusinessRole());
            user.setBusinessRole(request.getBusinessRole());
            assignedBusinessRole = request.getBusinessRole();
        }

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        var profileRequest = profileMapper.toProfileCreationRequest(request);
        profileRequest.setUserId(user.getId());

        // Send business role notification if a business role was assigned
        if (assignedBusinessRole != null && shouldNotifyForRole(assignedBusinessRole)) {
            sendBusinessRoleChangeNotification(user, null, assignedBusinessRole, department, "ROLE_ASSIGNED");
        }

        NotificationEvent notificationEvent = NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(request.getEmail())
                .recipientName(request.getFirstName() + " " + request.getLastName())
                .subject("Welcome to Bookteria Management System")
                .body(createSystemWelcomeEmailHtml(request.getFirstName()))
                .contentType("text/html")
                .build();

        // Publish message to kafka
        kafkaTemplate.send("notification-delivery", notificationEvent);

        var userCreationReponse = userMapper.toUserResponse(user);

        return userCreationReponse;
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String userId = context.getAuthentication().getName();

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {
        log.info("Updating user: {} with roles: {}", userId, request.getBusinessRole());

        // Find the user to update
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        log.info("User exists: {}", user.getId());

        // Track old business role for notification
        BusinessRole oldBusinessRole = user.getBusinessRole();
        Department oldDepartment = user.getDepartment();

        userMapper.updateUser(user, request);

        if (request.getPassword() != null) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        if (request.getRoles() != null) {
            var roles = roleRepository.findAllById(request.getRoles());
            user.setRoles(new HashSet<>(roles));
        }

        // Handle department update
        Department newDepartment = oldDepartment;
        if (request.getDepartmentId() != null) {
            newDepartment = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
            user.setDepartment(newDepartment);
        }

        // Handle business role update
        BusinessRole newBusinessRole = oldBusinessRole;
        if (request.getBusinessRole() != null) {
            businessAuthorizationService.checkBusinessRoleAssignmentAuthority(request.getBusinessRole());

            if (user.getDepartment() != null) {
                Department department = user.getDepartment();
                // Handle HEADER_DEPARTMENT assignment
                if (request.getBusinessRole() == BusinessRole.HEADER_DEPARTMENT) {
                    // Demote all other headers
                    var currentHeaders = userRepository.findByDepartmentIdAndBusinessRole(
                            department.getId(), BusinessRole.HEADER_DEPARTMENT);
                    for (User header : currentHeaders) {
                        if (!header.getId().equals(user.getId())) {
                            header.setBusinessRole(BusinessRole.MEMBER);
                            userRepository.save(header);
                        }
                    }
                    // Demote current department header if different
                    if (department.getHeader() != null
                            && !department.getHeader().getId().equals(user.getId())) {
                        User oldHeader = department.getHeader();
                        oldHeader.setBusinessRole(BusinessRole.MEMBER);
                        userRepository.save(oldHeader);
                    }
                    // Set department header
                    department.setHeader(user);
                    departmentRepository.save(department);
                } else if (oldBusinessRole == BusinessRole.HEADER_DEPARTMENT
                        && department.getHeader() != null
                        && department.getHeader().getId().equals(user.getId())) {
                    // If user is being demoted from header, clear department header
                    department.setHeader(null);
                    departmentRepository.save(department);
                }
                // Handle DEPUTY_DEPARTMENT assignment
                if (request.getBusinessRole() == BusinessRole.DEPUTY_DEPARTMENT) {
                    var currentDeputies = userRepository.findByDepartmentIdAndBusinessRole(
                            department.getId(), BusinessRole.DEPUTY_DEPARTMENT);
                    for (User deputy : currentDeputies) {
                        if (!deputy.getId().equals(user.getId())) {
                            deputy.setBusinessRole(BusinessRole.MEMBER);
                            userRepository.save(deputy);
                        }
                    }
                    // Demote current department deputy if different
                    if (department.getDeputy() != null
                            && !department.getDeputy().getId().equals(user.getId())) {
                        User oldDeputy = department.getDeputy();
                        oldDeputy.setBusinessRole(BusinessRole.MEMBER);
                        userRepository.save(oldDeputy);
                    }
                    // Set department deputy
                    department.setDeputy(user);
                    departmentRepository.save(department);
                } else if (oldBusinessRole == BusinessRole.DEPUTY_DEPARTMENT
                        && department.getDeputy() != null
                        && department.getDeputy().getId().equals(user.getId())) {
                    // If user is being demoted from deputy, clear department deputy
                    department.setDeputy(null);
                    departmentRepository.save(department);
                }
            }
            user.setBusinessRole(request.getBusinessRole());
            newBusinessRole = request.getBusinessRole();
        }

        User savedUser = userRepository.save(user);

        // Send business role change notification if role changed and should notify
        if (hasBusinessRoleChanged(oldBusinessRole, newBusinessRole)
                && (shouldNotifyForRole(oldBusinessRole) || shouldNotifyForRole(newBusinessRole))) {

            String eventType = oldBusinessRole == null
                    ? "ROLE_ASSIGNED"
                    : newBusinessRole == null ? "ROLE_REMOVED" : "ROLE_UPDATED";

            sendBusinessRoleChangeNotification(savedUser, oldBusinessRole, newBusinessRole, newDepartment, eventType);
        }

        return userMapper.toUserResponse(savedUser);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(String userId) {
        userRepository.deleteById(userId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsers() {
        log.info("In method get Users");
        return userRepository.findAll().stream().map(userMapper::toUserResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse getUser(String id) {
        return userMapper.toUserResponse(
                userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED)));
    }

    //    @PreAuthorize("hasRole('ADMIN')")
    //    public UserResponse createAdminUser(AdminUserCreationRequest request) {
    //        log.info("Creating admin user: {}", request.getUsername());
    //
    //        // Create user entity from request
    //        User user = new User();
    //        user.setUsername(request.getUsername());
    //        user.setPassword(passwordEncoder.encode(request.getPassword()));
    //        user.setEmail(request.getEmail());
    //        user.setFirstName(request.getFirstName());
    //        user.setLastName(request.getLastName());
    //        user.setEmployeeId(request.getEmployeeId());
    //        user.setPhoneNumber(request.getPhoneNumber());
    //        user.setEmailVerified(request.isEmailVerified()); // Admin can set email verification status
    //
    //        // Set system roles - admin can assign multiple roles including ADMIN
    //        HashSet<Role> roles = new HashSet<>();
    //        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
    //            var requestedRoles = roleRepository.findAllById(request.getRoles());
    //            roles.addAll(requestedRoles);
    //        } else {
    //            // Default to USER role if no roles specified
    //            roleRepository.findById(PredefinedRole.USER_ROLE).ifPresent(roles::add);
    //        }
    //        user.setRoles(roles);
    //
    //        // Handle required department assignment for admin users
    //        Department department = departmentRepository
    //                .findById(request.getDepartmentId())
    //                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
    //        user.setDepartment(department);
    //
    //        // Handle business role assignment
    //        BusinessRole assignedBusinessRole = request.getBusinessRole();
    //        if (assignedBusinessRole != null) {
    //            user.setBusinessRole(assignedBusinessRole);
    //        }
    //
    //        try {
    //            user = userRepository.save(user);
    //        } catch (DataIntegrityViolationException exception) {
    //            throw new AppException(ErrorCode.USER_EXISTED);
    //        }
    //
    //        // Create enhanced profile with admin-specific attributes
    //        var profileRequest = createAdminProfileRequest(request, user.getId());
    //        var profile = profileClient.createProfile(profileRequest);
    //
    //        // Send business role notification if a business role was assigned
    //        if (assignedBusinessRole != null && shouldNotifyForRole(assignedBusinessRole)) {
    //            sendBusinessRoleChangeNotification(user, null, assignedBusinessRole, department, "ROLE_ASSIGNED");
    //        }
    //
    //        // Send admin welcome notification
    //        NotificationEvent notificationEvent = NotificationEvent.builder()
    //                .channel("EMAIL")
    //                .recipient(request.getEmail())
    //                .subject("Welcome to the Administration System")
    //                .body(String.format(
    //                    "Hello %s %s,\n\nYour administrator account has been created successfully.\n" +
    //                    "Username: %s\nDepartment: %s\nEmployee ID: %s\n" +
    //                    "Please log in and change your password on first access.\n\nBest regards,\nAdmin Team",
    //                    request.getFirstName(), request.getLastName(),
    //                    request.getUsername(), department.getName(), request.getEmployeeId()))
    //                .build();
    //
    //        // Publish message to kafka
    //        kafkaTemplate.send("notification-delivery", notificationEvent);
    //
    //        var userCreationResponse = userMapper.toUserResponse(user);
    //        userCreationResponse.setId(profile.getResult().getId());
    //
    //        log.info("Successfully created admin user: {} with roles: {}",
    //                user.getUsername(), user.getRoles().stream().map(Role::getName).toList());
    //
    //        return userCreationResponse;
    //    }

    //    private Object createAdminProfileRequest(AdminUserCreationRequest request, String userId) {
    //        // Create profile request with all admin-specific attributes
    //        var profileRequest = profileMapper.toProfileCreationRequest(
    //            UserCreationRequest.builder()
    //                .username(request.getUsername())
    //                .email(request.getEmail())
    //                .firstName(request.getFirstName())
    //                .lastName(request.getLastName())
    //                .dob(request.getDob())
    //                .city(request.getCity())
    //                .departmentId(request.getDepartmentId())
    //                .businessRole(request.getBusinessRole())
    //                .employeeId(request.getEmployeeId())
    //                .phoneNumber(request.getPhoneNumber())
    //                .build()
    //        );
    //
    //        profileRequest.setUserId(userId);
    //
    //        // Add admin-specific profile attributes if the profile service supports them
    //        // You might need to extend the profile service to handle these additional fields:
    //        // - position
    //        // - startDate
    //        // - managerId
    //        // - notes
    //
    //        return profileRequest;
    //    }

    private boolean shouldNotifyForRole(BusinessRole role) {
        return role != null
                && (role == BusinessRole.DIRECTOR
                        || role == BusinessRole.SECRETARY
                        || role == BusinessRole.HEADER_DEPARTMENT
                        || role == BusinessRole.DEPUTY_DEPARTMENT);
    }

    private boolean hasBusinessRoleChanged(BusinessRole oldRole, BusinessRole newRole) {
        if (oldRole == null && newRole == null) return false;
        if (oldRole == null || newRole == null) return true;
        return !oldRole.equals(newRole);
    }

    private void sendBusinessRoleChangeNotification(
            User user, BusinessRole oldRole, BusinessRole newRole, Department department, String eventType) {
        try {
            String currentUsername =
                    SecurityContextHolder.getContext().getAuthentication().getName();

            BusinessRoleChangeEvent event = BusinessRoleChangeEvent.builder()
                    .userId(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .oldRole(oldRole)
                    .newRole(newRole)
                    .departmentId(department != null ? department.getId() : null)
                    .departmentName(department != null ? department.getName() : null)
                    .changedBy(currentUsername)
                    .timestamp(LocalDateTime.now())
                    .eventType(eventType)
                    .build();

            businessRoleNotificationService.sendBusinessRoleChangeNotification(event);

        } catch (Exception e) {
            log.error("Failed to send business role change notification for user: {}", user.getUsername(), e);
        }
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUserByAdmin(UserCreationRequest request) {
        log.info("Admin creating user: {}", request.getUsername());

        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));

        // Admin can control email verification status
        // If not specified, default to true for admin-created users
        user.setEmailVerified(true);

        // Assign system roles based on business role (same as createUser)
        HashSet<Role> roles = new HashSet<>();
        if (request.getBusinessRole() != null
                && request.getBusinessRole().name().equals("MEMBER")) {
            log.info("Business role is MEMBER, assigning MEMBER system role (admin).");
            roleRepository
                    .findById("MEMBER")
                    .ifPresentOrElse(roles::add, () -> log.error("MEMBER role not found in roleRepository! (admin)"));
        } else if (request.getBusinessRole() != null) {
            for (String systemRoleName : mapBusinessRoleToSystemRoles(request.getBusinessRole())) {
                log.info(
                        "Trying to assign system role: {} for business role: {} (admin)",
                        systemRoleName,
                        request.getBusinessRole());
                roleRepository.findById(systemRoleName).ifPresent(roles::add);
            }
        }
        user.setRoles(roles);

        // Handle department assignment (admin can assign any department)
        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
            user.setDepartment(department);
        }

        // Handle business role assignment (admin can assign any business role without restrictions)
        BusinessRole assignedBusinessRole = null;
        if (request.getBusinessRole() != null) {
            // Skip authorization check for admin - they can assign any business role
            user.setBusinessRole(request.getBusinessRole());
            assignedBusinessRole = request.getBusinessRole();
        }

        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException exception) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        var profileRequest = profileMapper.toProfileCreationRequest(request);
        profileRequest.setUserId(user.getId());

        // Create profile for the new user
        try {
            var profile = profileClient.createProfile(profileRequest);
            log.info("Profile created for userId {}: {}", user.getId(), profile);
        } catch (Exception e) {
            log.error("Failed to create profile for userId {}: {}", user.getId(), e.getMessage());
        }
        // Send business role notification if a business role was assigned
        if (assignedBusinessRole != null && shouldNotifyForRole(assignedBusinessRole)) {
            sendBusinessRoleChangeNotification(user, null, assignedBusinessRole, department, "ROLE_ASSIGNED");
        }

        // Send admin-created user notification
        NotificationEvent notificationEvent = NotificationEvent.builder()
                .channel("EMAIL")
                .recipient(request.getEmail())
                .recipientName(request.getFirstName() + " " + request.getLastName())
                .templateCode("USER_WELCOME")
                .subject("Account Created by Administrator")
                .body(createWelcomeEmailHtml(
                        request.getFirstName(),
                        request.getUsername(),
                        department != null ? department.getName() : "Not assigned",
                        request.getEmployeeId() != null ? request.getEmployeeId() : "Not assigned"))
                .contentType("text/html")
                .build();

        // Publish message to kafka
        kafkaTemplate.send("notification-delivery", notificationEvent);

        var userCreationResponse = userMapper.toUserResponse(user);

        log.info(
                "Admin successfully created user: {} with business role: {}", user.getUsername(), assignedBusinessRole);

        return userCreationResponse;
    }

    private String createWelcomeEmailHtml(String firstName, String username, String department, String employeeId) {
        return String.format(
                """
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Welcome to Bookteria</title>
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
						background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
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

					.welcome-message {
						font-size: 18px;
						color: #2c3e50;
						margin-bottom: 30px;
						line-height: 1.8;
					}

					.account-details {
						background-color: #f8f9fa;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						border-left: 4px solid #667eea;
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

					.status-badge {
						background-color: #28a745;
						color: white;
						padding: 6px 12px;
						border-radius: 20px;
						font-size: 12px;
						font-weight: 600;
						text-transform: uppercase;
						letter-spacing: 0.5px;
					}

					.action-section {
						background-color: #e3f2fd;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						text-align: center;
					}

					.action-section h3 {
						color: #1976d2;
						margin-bottom: 15px;
						font-size: 18px;
					}

					.action-section p {
						color: #424242;
						margin-bottom: 20px;
					}

					.cta-button {
						display: inline-block;
						background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%);
						color: white;
						padding: 12px 30px;
						text-decoration: none;
						border-radius: 25px;
						font-weight: 600;
						font-size: 14px;
						transition: all 0.3s ease;
						box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					}

					.cta-button:hover {
						transform: translateY(-2px);
						box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
						color: #667eea;
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
						<h1>🎉 Welcome to Bookteria!</h1>
						<p>Your account has been successfully created</p>
					</div>

					<div class="content">
						<div class="welcome-message">
							Hello <strong>%s</strong>,<br><br>
							Welcome to the Internal Management System! Your account has been created by an administrator and is now ready for use.
						</div>

						<div class="account-details">
							<div class="detail-row">
								<span class="detail-label">Username:</span>
								<span class="detail-value">%s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Department:</span>
								<span class="detail-value">%s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Employee ID:</span>
								<span class="detail-value">%s</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Status:</span>
								<span class="status-badge">Active</span>
							</div>
						</div>

						<div class="action-section">
							<h3>🚀 Ready to Get Started?</h3>
							<p>Your account is fully configured and ready to use. You can now access all the features and tools available in our management system.</p>
							<a href="#" class="cta-button">Access Your Account</a>
						</div>

						<div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
							<h4 style="color: #856404; margin-bottom: 10px;">💡 Getting Started Tips:</h4>
							<ul style="color: #856404; margin-left: 20px;">
								<li>Complete your profile information</li>
								<li>Explore the available features and tools</li>
								<li>Connect with your team members</li>
								<li>Review your department's guidelines</li>
							</ul>
						</div>
					</div>

					<div class="footer">
						<p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
						<p class="signature">Best regards,<br>Admin Team</p>
						<div class="company-info">
							<p>Bookteria Management System</p>
							<p>Empowering teams, driving success</p>
						</div>
					</div>
				</div>
			</body>
			</html>
						""",
                firstName, username, department, employeeId);
    }

    private String createSystemWelcomeEmailHtml(String firstName) {
        return String.format(
                """
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Welcome to Bookteria</title>
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
						background: linear-gradient(135deg, #4facfe 0%%, #00f2fe 100%%);
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

					.welcome-message {
						font-size: 18px;
						color: #2c3e50;
						margin-bottom: 30px;
						line-height: 1.8;
					}

					.features-section {
						background-color: #f8f9fa;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						border-left: 4px solid #4facfe;
					}

					.features-section h3 {
						color: #2c3e50;
						margin-bottom: 20px;
						font-size: 20px;
					}

					.feature-list {
						list-style: none;
						padding: 0;
					}

					.feature-list li {
						padding: 10px 0;
						border-bottom: 1px solid #e9ecef;
						display: flex;
						align-items: center;
					}

					.feature-list li:last-child {
						border-bottom: none;
					}

					.feature-icon {
						margin-right: 15px;
						font-size: 20px;
					}

					.action-section {
						background-color: #e8f5e8;
						border-radius: 8px;
						padding: 25px;
						margin: 25px 0;
						text-align: center;
					}

					.action-section h3 {
						color: #2e7d32;
						margin-bottom: 15px;
						font-size: 18px;
					}

					.action-section p {
						color: #424242;
						margin-bottom: 20px;
					}

					.cta-button {
						display: inline-block;
						background: linear-gradient(135deg, #4facfe 0%%, #00f2fe 100%%);
						color: white;
						padding: 12px 30px;
						text-decoration: none;
						border-radius: 25px;
						font-weight: 600;
						font-size: 14px;
						transition: all 0.3s ease;
						box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
					}

					.cta-button:hover {
						transform: translateY(-2px);
						box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
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
						color: #4facfe;
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
					}
				</style>
			</head>
			<body>
				<div class="email-container">
					<div class="header">
						<h1>🌟 Welcome to Bookteria!</h1>
						<p>Your journey with our management system begins now</p>
					</div>

					<div class="content">
						<div class="welcome-message">
							Hello <strong>%s</strong>,<br><br>
							Welcome to the Bookteria Management System! We're excited to have you join our team and start collaborating with us.
						</div>

						<div class="features-section">
							<h3>🚀 What You Can Do:</h3>
							<ul class="feature-list">
								<li><span class="feature-icon">💬</span> Connect with team members through our chat system</li>
								<li><span class="feature-icon">📁</span> Access and manage files and documents</li>
								<li><span class="feature-icon">👥</span> Collaborate with your department and team</li>
								<li><span class="feature-icon">📊</span> View and update your profile information</li>
								<li><span class="feature-icon">🔔</span> Receive real-time notifications and updates</li>
							</ul>
						</div>

						<div class="action-section">
							<h3>🎯 Ready to Get Started?</h3>
							<p>Your account is now active and ready to use. Explore the system and discover all the features available to you.</p>
							<a href="#" class="cta-button">Access Your Account</a>
						</div>

						<div style="margin-top: 30px; padding: 20px; background-color: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
							<h4 style="color: #856404; margin-bottom: 10px;">💡 Quick Tips:</h4>
							<ul style="color: #856404; margin-left: 20px;">
								<li>Complete your profile to help team members get to know you</li>
								<li>Explore the chat feature to connect with colleagues</li>
								<li>Check out the file management system for document sharing</li>
								<li>Stay updated with real-time notifications</li>
							</ul>
						</div>
					</div>

					<div class="footer">
						<p>If you have any questions or need assistance, our support team is here to help!</p>
						<p class="signature">Best regards,<br>System Team</p>
						<div class="company-info">
							<p>Bookteria Management System</p>
							<p>Empowering teams, driving success</p>
						</div>
					</div>
				</div>
			</body>
			</html>
			""",
                firstName);
    }
}
