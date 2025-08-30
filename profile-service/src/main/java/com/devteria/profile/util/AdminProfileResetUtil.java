package com.devteria.profile.util;

import com.devteria.profile.entity.UserProfile;
import com.devteria.profile.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
@Profile("admin-reset") // Only run when admin-reset profile is active
public class AdminProfileResetUtil implements CommandLineRunner {

    private final UserProfileRepository userProfileRepository;

    // Admin profile configuration
    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_EMAIL = "admin@bookteria.com";
    private static final String ADMIN_FIRST_NAME = "System";
    private static final String ADMIN_LAST_NAME = "Administrator";

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Admin Profile Reset Process...");

        try {
            // Clean up any existing admin profiles
            cleanupExistingAdminProfiles();

            log.info("Admin Profile Reset Process completed successfully!");

            // Exit application after completion
            System.exit(0);

        } catch (Exception e) {
            log.error("Admin Profile Reset Process failed", e);
            System.exit(1);
        }
    }

    private void cleanupExistingAdminProfiles() {
        log.info("Cleaning up existing admin profiles...");

        // Find profiles by admin username
        List<UserProfile> adminProfiles = userProfileRepository.findAllByUsernameLike("admin");

        for (UserProfile profile : adminProfiles) {
            log.info("Deleting admin profile: {} ({})", profile.getUsername(), profile.getId());
            userProfileRepository.delete(profile);
        }

        // Also find profiles with admin email
        userProfileRepository.findAll().forEach(profile -> {
            if (ADMIN_EMAIL.equals(profile.getEmail()) ||
                ADMIN_USERNAME.equals(profile.getUsername())) {
                log.info("Deleting admin profile by email/username: {}", profile.getId());
                userProfileRepository.delete(profile);
            }
        });

        log.info("Admin profiles cleanup completed");
    }

    // Method to create admin profile (called from identity service)
    public UserProfile createAdminProfile(String userId) {
        log.info("Creating admin profile for user ID: {}", userId);

        UserProfile adminProfile = UserProfile.builder()
                .userId(userId)
                .username(ADMIN_USERNAME)
                .email(ADMIN_EMAIL)
                .firstName(ADMIN_FIRST_NAME)
                .lastName(ADMIN_LAST_NAME)
                .dob(LocalDate.of(1990, 1, 1))
                .city("System City")
                .avatar("https://via.placeholder.com/150/0000FF/FFFFFF?text=ADMIN")
                .build();

        adminProfile = userProfileRepository.save(adminProfile);
        log.info("Admin profile created successfully with ID: {}", adminProfile.getId());

        return adminProfile;
    }
}
