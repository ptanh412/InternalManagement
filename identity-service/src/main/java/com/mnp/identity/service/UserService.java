package com.mnp.identity.service;

import java.util.List;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.mnp.event.dto.NotificationEvent;
import com.mnp.identity.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.UserCreationRequest;
import com.mnp.identity.dto.request.UserStatusUpdateRequest;
import com.mnp.identity.dto.request.UserUpdateRequest;
import com.mnp.identity.dto.response.UserProfileResponse;
import com.mnp.identity.dto.response.UserResponse;
import com.mnp.identity.entity.Department;
import com.mnp.identity.entity.Position;
import com.mnp.identity.entity.Role;
import com.mnp.identity.entity.User;
import com.mnp.identity.exception.AppException;
import com.mnp.identity.exception.ErrorCode;
import com.mnp.identity.mapper.InterServiceMapper;
import com.mnp.identity.mapper.ProfileMapper;
import com.mnp.identity.mapper.UserMapper;
import com.mnp.identity.repository.DepartmentRepository;
import com.mnp.identity.repository.PositionRepository;
import com.mnp.identity.repository.RoleRepository;
import com.mnp.identity.repository.UserRepository;
import com.mnp.identity.repository.httpclient.ProfileClient;

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
    PositionRepository positionRepository;
    UserMapper userMapper;
    ProfileMapper profileMapper;
    PasswordEncoder passwordEncoder;
    ProfileClient profileClient;
    KafkaTemplate<String, Object> kafkaTemplate;

    /**
     * Generates the next employee ID in format EMP001, EMP002, etc.
     * @return Next available employee ID
     */
    private String generateNextEmployeeId() {
        List<String> existingIds = userRepository.findAllEmployeeIdsOrderedDesc();

        if (existingIds.isEmpty()) {
            return "EMP001";
        }

        // Get the highest employee ID and extract the number
        String highestId = existingIds.get(0);
        try {
            int currentNumber = Integer.parseInt(highestId.substring(3)); // Remove "EMP" prefix
            int nextNumber = currentNumber + 1;
            return String.format("EMP%03d", nextNumber); // Format with leading zeros
        } catch (NumberFormatException e) {
            log.warn("Invalid employee ID format found: {}, starting from EMP001", highestId);
            return "EMP001";
        }
    }

    public void updateUserStatus(String userId, UserStatusUpdateRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        if (request.getOnline() != null) {
            user.setOnline(request.getOnline());
        }
        if (request.getLastLogin() != null) {
            user.setLastLogin(request.getLastLogin());
        }
        userRepository.save(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse createUser(UserCreationRequest request) {
        log.info("Creating user with username: {}", request.getUsername());

        // Check if user already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new AppException(ErrorCode.USER_EXISTED);
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AppException(ErrorCode.EMAIL_EXISTED);
        }

        // Auto-generate employee ID if not provided
        String employeeId = request.getEmployeeId();
        if (employeeId == null || employeeId.trim().isEmpty()) {
            employeeId = generateNextEmployeeId();
            log.info("Auto-generated employee ID: {}", employeeId);
        } else {
            // Validate provided employee ID doesn't already exist
            if (userRepository.existsByEmployeeId(employeeId)) {
                throw new AppException(ErrorCode.EMPLOYEE_ID_EXISTED);
            }
        }

        // Create user entity
        User user = userMapper.toUser(request);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmployeeId(employeeId); // Set the employee ID (auto-generated or provided)

        // Set department if provided
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
            user.setDepartment(department);
        }

        // Set position if provided
        if (request.getPositionId() != null) {
            Position position = positionRepository
                    .findById(request.getPositionId())
                    .orElseThrow(() -> new AppException(ErrorCode.POSITION_NOT_EXISTED));
            user.setPosition(position);
        }

        Role roleRequest = roleRepository.findById(request.getRoleId()).orElse(null);
        user.setRole(roleRequest);

        // Save user
        user = userRepository.save(user);

        log.info("User created successfully with ID: {}", user.getId());

        // Create user profile with skills through InternalProfileClient
        if (request.getDob() != null
                || request.getCity() != null
                || request.getSkills() != null
                || request.getAvailabilityStatus() != null) {
            try {
                // Use inter-service mapper to convert to inter-service request
                InterServiceMapper interServiceMapper = new InterServiceMapper();
                InterServiceProfileCreationRequest profileRequest = interServiceMapper.toInterServiceRequest(
                        user.getId(),
                        request.getAvatar(),
                        request.getDob(),
                        request.getCity(),
                        request.getSkills(),
                        request.getAvailabilityStatus());

                ApiResponse<UserProfileResponse> profileResponse =
                        profileClient.createProfileInterService(profileRequest);
                if (profileResponse != null && profileResponse.getResult() != null) {
                    log.info(
                            "✓ User profile created successfully with ID: {} and {} skills",
                            profileResponse.getResult().getId(),
                            request.getSkills() != null ? request.getSkills().size() : 0);
                } else {
                    log.warn("⚠ User profile creation returned null or empty result for user: {}", user.getId());
                }
            } catch (Exception e) {
                log.error("❌ Failed to create user profile for user {}: {}", user.getId(), e.getMessage());
                // Continue without failing the user creation, but log the error
                log.info("   → User created successfully but profile creation failed");
            }
        } else {
            log.info("No profile data provided, skipping profile creation for user: {}", user.getId());
        }

        // Send welcome email notification
        try {
            String departmentName =
                    user.getDepartment() != null ? user.getDepartment().getName() : "N/A";

            String emailContent = createWelcomeEmailHtml(
                    user.getFirstName(), user.getUsername(), departmentName, user.getEmployeeId());

            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .channel("EMAIL")
                    .recipient(user.getEmail())
                    .subject("Welcome to Project Management - Your Account Has Been Created")
                    .body(emailContent)
                    .build();

            kafkaTemplate.send("notification-delivery", notificationEvent);
        } catch (Exception e) {
            log.error("Failed to send welcome email for user: {}", user.getUsername(), e);
        }

        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateUser(String userId, UserUpdateRequest request) {

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Update basic fields
        userMapper.updateUser(user, request);

        // Update department if provided
        if (request.getDepartmentId() != null) {
            Department department = departmentRepository
                    .findById(request.getDepartmentId())
                    .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));
            user.setDepartment(department);
        }

        // Update position if provided
        if (request.getPositionId() != null) {
            Position position = positionRepository
                    .findById(request.getPositionId())
                    .orElseThrow(() -> new AppException(ErrorCode.POSITION_NOT_EXISTED));
            user.setPosition(position);
        }

        // Update role if provided
        if (request.getRoleId() != null) {
            Role role = roleRepository
                    .findById(request.getRoleId())
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
            user.setRole(role);
        }

        return userMapper.toUserResponse(userRepository.save(user));
    }

    public UserResponse getMyInfo() {
        var context = SecurityContextHolder.getContext();
        String userId = context.getAuthentication().getName();

        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userMapper.toUserResponse(user);
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

    // New method for detailed user information including relationships
    public UserResponse getUserDetailed(String id) {
        User user = userRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userMapper.toUserDetailedResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getUsersByDepartment(String departmentId) {
        Department department = departmentRepository
                .findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));

        return userRepository.findByDepartment(department).stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getActiveUsers() {
        return userRepository.findByIsActiveTrue().stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserResponse> getInactiveUsers() {
        return userRepository.findByIsActiveFalse().stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN') or hasRole('PROJECT_MANAGER')")
    public List<UserResponse> getUsersByRole(String roleName) {
        Role role = roleRepository.findByName(roleName).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        return userRepository.findByRoleAndIsActiveTrue(role).stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse activateUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(true);
        user = userRepository.save(user);
        log.info("User activated successfully with ID: {}", userId);
        return userMapper.toUserResponse(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse deactivateUser(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        user.setActive(false);
        user = userRepository.save(user);
        log.info("User deactivated successfully with ID: {}", userId);
        return userMapper.toUserResponse(user);
    }

    private String createWelcomeEmailHtml(String firstName, String username, String department, String employeeId) {
        return String.format(
                """
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Welcome to Project Management</title>
			</head>
			<body>
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
					<h1 style="color: #333;">Welcome to Project Management!</h1>
					<p>Hello <strong>%s</strong>,</p>
					<p>Your account has been successfully created with the following details:</p>
					<ul>
						<li><strong>Username:</strong> %s</li>
						<li><strong>Department:</strong> %s</li>
						<li><strong>Employee ID:</strong> %s</li>
					</ul>
					<p>You can now access the Internal Management System.</p>
					<p>Best regards,<br>The Project Management Team</p>
				</div>
			</body>
			</html>
			""",
                firstName, username, department, employeeId);
    }
}
