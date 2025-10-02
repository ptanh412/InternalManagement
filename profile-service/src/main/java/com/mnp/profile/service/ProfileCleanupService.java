// package com.mnp.profile.service;
//
// import java.util.List;
// import java.util.Map;
// import java.util.stream.Collectors;
//
// import org.springframework.boot.CommandLineRunner;
// import org.springframework.stereotype.Service;
//
// import com.mnp.profile.entity.UserProfile;
// import com.mnp.profile.repository.UserProfileRepository;
//
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;
//
// @Service
// @RequiredArgsConstructor
// @Slf4j
// public class ProfileCleanupService implements CommandLineRunner {
//
//    private final UserProfileRepository userProfileRepository;
//
//    @Override
//    public void run(String... args) throws Exception {
//        log.info("Starting UserProfile duplicate cleanup process...");
//        cleanupDuplicateProfiles();
//    }
//
//    public void cleanupDuplicateProfiles() {
//        try {
//            List<UserProfile> allProfiles = userProfileRepository.findAll();
//
//            // Group profiles by userId
//            Map<String, List<UserProfile>> profilesByUserId = allProfiles.stream()
//                    .collect(Collectors.groupingBy(UserProfile::getUserId));
//
//            int duplicatesRemoved = 0;
//
//            for (Map.Entry<String, List<UserProfile>> entry : profilesByUserId.entrySet()) {
//                String userId = entry.getKey();
//                List<UserProfile> profiles = entry.getValue();
//
//                if (profiles.size() > 1) {
//                    log.info("Found {} duplicate profiles for userId: {}", profiles.size(), userId);
//
//                    // Sort by updatedAt DESC to keep the most recent one
//                    profiles.sort((p1, p2) -> {
//                        if (p1.getUpdatedAt() == null && p2.getUpdatedAt() == null) return 0;
//                        if (p1.getUpdatedAt() == null) return 1;
//                        if (p2.getUpdatedAt() == null) return -1;
//                        return p2.getUpdatedAt().compareTo(p1.getUpdatedAt());
//                    });
//
//                    // Keep the first one (most recent), delete the rest
//                    UserProfile profileToKeep = profiles.get(0);
//                    List<UserProfile> profilesToDelete = profiles.subList(1, profiles.size());
//
//                    log.info("Keeping profile {} (updated: {}) for userId: {}",
//                            profileToKeep.getId(), profileToKeep.getUpdatedAt(), userId);
//
//                    for (UserProfile profileToDelete : profilesToDelete) {
//                        log.info("Deleting duplicate profile {} (updated: {}) for userId: {}",
//                                profileToDelete.getId(), profileToDelete.getUpdatedAt(), userId);
//                        userProfileRepository.delete(profileToDelete);
//                        duplicatesRemoved++;
//                    }
//                }
//            }
//
//            log.info("UserProfile cleanup completed. Removed {} duplicate profiles.", duplicatesRemoved);
//
//        } catch (Exception e) {
//            log.error("Error during UserProfile cleanup: {}", e.getMessage(), e);
//        }
//    }
// }
