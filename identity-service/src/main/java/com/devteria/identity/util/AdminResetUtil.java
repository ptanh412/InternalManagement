package com.devteria.identity.util;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import com.devteria.identity.entity.Department;
import com.devteria.identity.entity.Permission;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.repository.DepartmentRepository;
import com.devteria.identity.repository.PermissionRepository;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("admin-reset") // Only run when admin-reset profile is active
public class AdminResetUtil implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final RestTemplate restTemplate = new RestTemplate();

    // Admin configuration
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@bookteria.com";
    private static final String ADMIN_PASSWORD = "Admin@123456";
    private static final String ADMIN_FIRST_NAME = "System";
    private static final String ADMIN_LAST_NAME = "Administrator";
    private static final String PROFILE_SERVICE_URL =
            "http://localhost:8081/profile"; // Fixed: Changed from 8083 to 8081

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Admin Reset Process...");

        try {
            // Step 1: Delete all existing admin users
            deleteExistingAdmins();

            // Step 2: Ensure ADMIN role exists with all permissions
            Role adminRole = createOrUpdateAdminRole();

            // Step 3: Create new admin user in identity service
            User newAdmin = createAdminUser(adminRole);

            // Step 4: Create admin profile in profile service
            createAdminProfile(newAdmin);

            log.info("Admin Reset Process completed successfully!");
            log.info("New admin created:");
            log.info("  Username: {}", ADMIN_USERNAME);
            log.info("  Email: {}", ADMIN_EMAIL);
            log.info("  Password: {}", ADMIN_PASSWORD);
            log.info("  User ID: {}", newAdmin.getId());
            log.info("  First Name: {}", newAdmin.getFirstName());
            log.info("  Last Name: {}", newAdmin.getLastName());
            log.info("  Employee ID: {}", newAdmin.getEmployeeId());
            log.info("  Phone: {}", newAdmin.getPhoneNumber());
            log.info("  Business Role: {}", newAdmin.getBusinessRole());
            log.info(
                    "  Department: {}",
                    newAdmin.getDepartment() != null ? newAdmin.getDepartment().getName() : "None");
            log.info("  Join Date: {}", newAdmin.getJoinDate());
            log.info("  Active: {}", newAdmin.isActive());

            // Exit application after completion since this is a one-time script
            System.exit(0);

        } catch (Exception e) {
            log.error("Admin Reset Process failed", e);
            System.exit(1);
        }
    }

    //    @Transactional
    private void deleteExistingAdmins() {
        log.info("Deleting existing admin users...");

        // Find and delete users with ADMIN role using eager fetch to avoid lazy loading
        List<User> allUsers = userRepository.findAllWithRoles();
        for (User user : allUsers) {
            if (user.getRoles() != null && user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName()))) {
                log.info("Deleting admin user: {} ({})", user.getUsername(), user.getId());

                // Delete profile from profile service first
                deleteUserProfile(user.getId());

                // Delete user from identity service
                userRepository.delete(user);
            }
        }

        // Also delete specific admin username if exists
        userRepository.findByUsername(ADMIN_USERNAME).ifPresent(user -> {
            log.info("Deleting existing admin user: {}", user.getUsername());
            deleteUserProfile(user.getId());
            userRepository.delete(user);
        });

        log.info("Existing admin users deleted successfully");
    }

    private Role createOrUpdateAdminRole() {
        log.info("Creating/updating ADMIN role...");

        // Create all necessary permissions for admin
        Set<Permission> adminPermissions = createAdminPermissions();

        // Create or update ADMIN role
        Role adminRole = roleRepository
                .findById("ADMIN")
                .orElse(Role.builder()
                        .name("ADMIN")
                        .description("System Administrator with full access")
                        .build());

        adminRole.setPermissions(adminPermissions);
        adminRole = roleRepository.save(adminRole);

        log.info("ADMIN role created/updated with {} permissions", adminPermissions.size());
        return adminRole;
    }

    private Set<Permission> createAdminPermissions() {
        // Define all admin permissions
        String[] permissionNames = {
            "USER_READ", "USER_WRITE", "USER_DELETE",
            "PROFILE_READ", "PROFILE_WRITE", "PROFILE_DELETE",
            "POST_READ", "POST_WRITE", "POST_DELETE",
            "CHAT_READ", "CHAT_WRITE", "CHAT_DELETE",
            "FILE_READ", "FILE_WRITE", "FILE_DELETE",
            "ADMIN_PANEL", "SYSTEM_CONFIG", "USER_MANAGEMENT"
        };

        Set<Permission> permissions = new HashSet<>();
        for (String permName : permissionNames) {
            Permission permission = permissionRepository
                    .findById(permName)
                    .orElse(Permission.builder()
                            .name(permName)
                            .description("Admin permission: " + permName)
                            .build());
            permission = permissionRepository.save(permission);
            permissions.add(permission);
        }

        return permissions;
    }

    private User createAdminUser(Role adminRole) {
        log.info("Creating new admin user...");

        // Get or create a default department for admin
        Department adminDepartment = departmentRepository
                .findByName("Headquarters")
                .orElseGet(() -> {
                    Department dept = Department.builder().name("Headquarters").build();
                    return departmentRepository.save(dept);
                });

        User adminUser = User.builder()
                .username(ADMIN_USERNAME)
                .email(ADMIN_EMAIL)
                .password(passwordEncoder.encode(ADMIN_PASSWORD))
                .emailVerified(true)
                .firstName(ADMIN_FIRST_NAME)
                .lastName(ADMIN_LAST_NAME)
                .employeeId("EMP-ADMIN-001")
                .phoneNumber("+1-555-0100")
                .joinDate(java.time.LocalDateTime.now())
                .isActive(true)
                .businessRole(BusinessRole.DIRECTOR)
                .department(adminDepartment)
                .roles(Set.of(adminRole))
                .build();

        adminUser = userRepository.save(adminUser);
        log.info("Admin user created with ID: {} and department: {}", adminUser.getId(), adminDepartment.getName());

        return adminUser;
    }

    private void createAdminProfile(User adminUser) {
        log.info("Creating admin profile in profile service...");

        try {
            // Prepare profile data
            Map<String, Object> profileData = new HashMap<>();
            profileData.put("userId", adminUser.getId());
            profileData.put("username", adminUser.getUsername());
            profileData.put("email", adminUser.getEmail());
            profileData.put("firstName", ADMIN_FIRST_NAME);
            profileData.put("lastName", ADMIN_LAST_NAME);
            profileData.put("dob", "1990-01-01"); // Keep as string for JSON serialization
            profileData.put("city", "System City");

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(profileData, headers);

            // Create profile via REST call to profile service using internal endpoint
            ResponseEntity<String> response =
                    restTemplate.postForEntity(PROFILE_SERVICE_URL + "/internal/users", request, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Admin profile created successfully in profile service");
            } else {
                log.error("Failed to create admin profile: {}", response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Error creating admin profile in profile service", e);
            // Don't fail the whole process if profile creation fails
        }
    }

    private void deleteUserProfile(String userId) {
        log.info("Deleting user profile for user ID: {}", userId);

        try {
            restTemplate.delete(PROFILE_SERVICE_URL + "/users/" + userId);
            log.info("Profile deleted successfully for user: {}", userId);
        } catch (Exception e) {
            log.warn("Could not delete profile for user {}: {}", userId, e.getMessage());
            // Don't fail if profile deletion fails - it might not exist
        }
    }
}
