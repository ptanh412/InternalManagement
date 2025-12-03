package com.mnp.profile.service;

import java.util.List;

import com.mnp.profile.dto.response.TaskMetricsResponse;
import com.mnp.profile.repository.httpclient.TaskServiceClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.mnp.profile.dto.request.ProfileCreationRequest;
import com.mnp.profile.dto.request.SearchUserRequest;
import com.mnp.profile.dto.request.UpdateProfileRequest;
import com.mnp.profile.dto.response.UserProfileResponse;
import com.mnp.profile.dto.response.UserResponse;
import com.mnp.profile.entity.UserProfile;
import com.mnp.profile.exception.AppException;
import com.mnp.profile.exception.ErrorCode;
import com.mnp.profile.mapper.UserProfileMapper;
import com.mnp.profile.repository.UserProfileRepository;
import com.mnp.profile.repository.httpclient.FileClient;
import com.mnp.profile.repository.httpclient.IdentityClient;

import feign.FeignException;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    FileClient fileClient;
    IdentityClient identityClient;
    UserProfileMapper userProfileMapper;
    TaskServiceClient taskServiceClient;

    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        log.info("Creating profile for userId: {}", request.getUserId());
        UserProfile userProfile = userProfileMapper.toUserProfile(request);
        userProfile.onCreate(); // Set timestamps
        userProfile = userProfileRepository.save(userProfile);
        log.info(
                "Profile created successfully with ID: {} for userId: {}",
                userProfile.getId(),
                userProfile.getUserId());

        return buildUserProfileResponse(userProfile);
    }

    public UserProfileResponse getByUserId(String userId) {
        log.info("Looking up profile for userId: {}", userId);
        UserProfile userProfile = userProfileRepository
                .findLatestByUserId(userId)
                .orElseThrow(() -> {
                    log.error("Profile not found for userId: {}", userId);
                    return new AppException(ErrorCode.USER_NOT_EXISTED);
                });

        log.info("Profile found: {} for userId: {}", userProfile.getId(), userId);
        return buildUserProfileResponse(userProfile);
    }

    public UserProfileResponse getProfile(String id) {
        UserProfile userProfile =
                userProfileRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return buildUserProfileResponse(userProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllProfiles() {
        var profiles = userProfileRepository.findAll();

        return profiles.stream().map(this::buildUserProfileResponse).toList();
    }

    public UserProfileResponse getMyProfile() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        // Use findAllByUserId to get all profiles for this user, then select the latest one
        // This ensures relationships are properly loaded
        var profiles = userProfileRepository.findAllByUserId(userId);

        if (profiles.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }

        // Sort by updatedAt to get the most recent profile
        var profile = profiles.stream()
                .min((p1, p2) -> {
                    if (p1.getUpdatedAt() == null && p2.getUpdatedAt() == null) return 0;
                    if (p1.getUpdatedAt() == null) return 1;
                    if (p2.getUpdatedAt() == null) return -1;
                    return p2.getUpdatedAt().compareTo(p1.getUpdatedAt());
                })
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return buildUserProfileResponse(profile);
    }

    public UserProfileResponse updateMyProfile(UpdateProfileRequest request) {
        log.info("Updating my profile: {} ", request.getAvatar());
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository
                .findLatestByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userProfileMapper.update(profile, request);
        profile.onUpdate(); // Update timestamp

        log.info("Profile before save - avatar: {}, updatedAt: {}",
                profile.getAvatar(), profile.getUpdatedAt());

        UserProfile savedProfile = userProfileRepository.save(profile);

        log.info("Profile after save - avatar: {}", savedProfile.getAvatar());


        return buildUserProfileResponse(savedProfile);
    }

    public UserProfileResponse updateAvatar(MultipartFile file) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository
                .findLatestByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        var response = fileClient.uploadMedia(file);

        profile.setAvatar(response.getResult().getUrl());
        profile.onUpdate(); // Update timestamp

        return buildUserProfileResponse(userProfileRepository.save(profile));
    }

    public List<UserProfileResponse> search(SearchUserRequest request) {
        var userId = SecurityContextHolder.getContext().getAuthentication().getName();

        // First get user data from identity-service to search by username
        // For now, we'll search profiles by userId and then filter based on user data
        List<UserProfile> userProfiles = userProfileRepository.findAll();

        return userProfiles.stream()
                .filter(userProfile -> !userId.equals(userProfile.getUserId()))
                .map(this::buildUserProfileResponse)
                .filter(response -> response.getUser() != null
                        && response.getUser().getUsername() != null
                        && response.getUser()
                                .getUsername()
                                .toLowerCase()
                                .contains(request.getKeyword().toLowerCase()))
                .toList();
    }

    private UserProfileResponse buildUserProfileResponse(UserProfile userProfile) {
        UserProfileResponse response = userProfileMapper.toUserProfileResponse(userProfile);

        // Fetch user data from identity-service with improved error handling
        try {
            var userResponse = identityClient.getUser(userProfile.getUserId());
            if (userResponse != null && userResponse.getResult() != null) {
                response.setUser(userResponse.getResult());
            } else {
                // Set fallback when response is null or empty
                response.setUser(createFallbackUserResponse(userProfile.getUserId()));
            }
        } catch (FeignException.Unauthorized e) {
            log.warn(
                    "Unauthorized access to identity service for userId: {}. Using fallback user data.",
                    userProfile.getUserId());
            response.setUser(createFallbackUserResponse(userProfile.getUserId()));
        } catch (FeignException e) {
            log.warn(
                    "Feign error accessing identity service for userId: {}. Status: {}, Message: {}",
                    userProfile.getUserId(),
                    e.status(),
                    e.getMessage());
            response.setUser(createFallbackUserResponse(userProfile.getUserId()));
        } catch (Exception e) {
            log.warn(
                    "Unexpected error fetching user data for userId: {}, error: {}",
                    userProfile.getUserId(),
                    e.getMessage());
            response.setUser(createFallbackUserResponse(userProfile.getUserId()));
        }

        // Enrich with task metrics from task-service
        enrichWithTaskMetrics(userProfile, response);

        return response;
    }

    /**
     * Enrich UserProfile with real-time task metrics from task-service
     */
    private void enrichWithTaskMetrics(UserProfile userProfile, UserProfileResponse response) {
        try {
            var metricsResponse = taskServiceClient.getUserTaskMetrics(userProfile.getUserId());

            if (metricsResponse != null && metricsResponse.getResult() != null) {
                TaskMetricsResponse metrics = metricsResponse.getResult();

                // Update the response with real task metrics
                response.setTotalTasksCompleted(metrics.getCompletedTasks());

                // Calculate completion rate based on completed vs total tasks
                if (metrics.getTotalTasks() > 0) {
                    double completionRate = (double) metrics.getCompletedTasks() / metrics.getTotalTasks();
                    response.setAverageTaskCompletionRate(completionRate);
                } else {
                    response.setAverageTaskCompletionRate(0.0);
                }

                // Update the entity if values have changed (for persistence)
                boolean needsUpdate = false;

                if (metrics.getCompletedTasks() != userProfile.getTotalTasksCompleted()) {
                    userProfile.setTotalTasksCompleted(metrics.getCompletedTasks());
                    needsUpdate = true;
                }

                double newCompletionRate = metrics.getTotalTasks() > 0
                    ? (double) metrics.getCompletedTasks() / metrics.getTotalTasks()
                    : 0.0;

                if (Double.compare(newCompletionRate, userProfile.getAverageTaskCompletionRate()) != 0) {
                    userProfile.setAverageTaskCompletionRate(newCompletionRate);
                    needsUpdate = true;
                }

                // Save updated metrics back to database
                if (needsUpdate) {
                    userProfile.onUpdate();
                    userProfileRepository.save(userProfile);
                    log.info("Updated task metrics for user {}: completedTasks={}, completionRate={}",
                        userProfile.getUserId(), metrics.getCompletedTasks(), newCompletionRate);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to fetch task metrics for user {}: {}",
                userProfile.getUserId(), e.getMessage());
            // Don't fail the entire request, just use existing profile data
        }
    }

    private UserResponse createFallbackUserResponse(String userId) {
        return UserResponse.builder()
                .id(userId)
                .username("User-" + userId.substring(0, 8)) // Use first 8 chars of UUID
                .firstName("Unknown")
                .lastName("User")
                .email("unknown@company.com")
                .employeeId("EMP-" + userId.substring(0, 6))
                .departmentName("Unknown Department")
                .roleName("USER")
                .roleDescription("Standard user")
                .positionTitle("Unknown Position")
                .seniorityLevel("JUNIOR")
                .isActive(true)
                .emailVerified(false)
                .online(false)
                .build();
    }

    // AI Assignment System Service Methods
    public List<UserProfileResponse> getCandidatesBySkills(List<String> requiredSkills) {
        log.info("Finding candidates with skills: {}", requiredSkills);

        // This would require a proper skills relationship. For now, implementing basic logic
        // In a real implementation, you'd join with UserSkill table
        List<UserProfile> allProfiles = userProfileRepository.findAll();

        // Filter profiles that might have the required skills
        // This is a simplified implementation - you'd need proper skill matching logic
        return allProfiles.stream()
                .map(this::buildUserProfileResponse)
                .filter(profile -> profile.getUser() != null)
                .toList();
    }

    public List<UserProfileResponse> getAvailableCandidates() {
        log.info("Finding available candidates");

        // In a real implementation, you'd filter by availability status
        // For now, return all active profiles
        List<UserProfile> availableProfiles = userProfileRepository.findAll();

        return availableProfiles.stream()
                .map(this::buildUserProfileResponse)
                .filter(profile -> profile.getUser() != null)
                .toList();
    }

    public List<UserProfileResponse> getCandidatesByDepartment(String department) {
        log.info("Finding candidates in department: {}", department);

        // Assuming department is stored in UserProfile entity
        // You may need to add department field to UserProfile if it doesn't exist
        List<UserProfile> allProfiles = userProfileRepository.findAll();

        return allProfiles.stream()
                .filter(profile -> department.equalsIgnoreCase(getDepartmentFromProfile(profile)))
                .map(this::buildUserProfileResponse)
                .filter(profile -> profile.getUser() != null)
                .toList();
    }

    public List<UserProfileResponse> getCandidatesByWorkload(Double maxWorkload) {
        log.info("Finding candidates with workload <= {}", maxWorkload);

        // This would require workload tracking. For now, return available candidates
        // In a real implementation, you'd have workload fields in UserProfile
        return getAvailableCandidates().stream()
                .limit(10) // Simulate filtering by workload
                .toList();
    }

    public List<UserProfileResponse> getCandidatesByPerformance(Double minRating) {
        log.info("Finding candidates with performance rating >= {}", minRating);

        // This would require performance tracking. For now, return available candidates
        // In a real implementation, you'd have performance rating fields in UserProfile
        return getAvailableCandidates().stream()
                .limit(5) // Simulate high-performance candidates
                .toList();
    }

    private String getDepartmentFromProfile(UserProfile profile) {
        // Get department information from identity-service via the user data
        try {
            var userResponse = identityClient.getUser(profile.getUserId());
            if (userResponse.getResult() != null && userResponse.getResult().getDepartmentName() != null) {
                return userResponse.getResult().getDepartmentName();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch user department for userId: {}", profile.getUserId());
        }
        return "General"; // Default department if unable to fetch
    }

    // New methods for AI service compatibility
    public List<UserProfileResponse> getAllAvailableUsers() {
        log.info("Getting all available users");
        // For now, return all active users. You can add availability logic later
        var profiles = userProfileRepository.findAll();
        return profiles.stream()
                .map(this::buildUserProfileResponse)
                .filter(java.util.Objects::nonNull) // Basic filter for valid profiles
                .toList();
    }

    public List<UserProfileResponse> getAllUsers() {
        log.info("Getting all users");
        var profiles = userProfileRepository.findAll();
        return profiles.stream().map(this::buildUserProfileResponse).toList();
    }

    public List<UserProfileResponse> getTeamMembers(String teamId) {
        log.info("Getting team members for teamId: {}", teamId);
        // For now, return empty list. You can implement team-based filtering later
        // when you have team relationships in your UserProfile entity
        return List.of();
    }

    public List<UserProfileResponse> getUsersByDepartment(String department) {
        log.info("Getting users by department: {}", department);
        // Since department info comes from identity service, we need to filter after fetching user data
        var profiles = userProfileRepository.findAll();
        return profiles.stream()
                .map(this::buildUserProfileResponse)
                .filter(profile -> {
                    if (profile.getUser() != null && profile.getUser().getDepartmentName() != null) {
                        return department.equalsIgnoreCase(profile.getUser().getDepartmentName());
                    }
                    return false;
                })
                .toList();
    }

    public List<UserProfileResponse> getUsersBySkills(List<String> skills) {
        log.info("Getting users by skills: {}", skills);
        // For now, return all users. You can implement skill-based filtering later
        // when you have skills relationships in your UserProfile entity
        var profiles = userProfileRepository.findAll();
        return profiles.stream()
                .map(this::buildUserProfileResponse)
                .filter(profile -> {
                    // Basic implementation - you can enhance this with proper skill matching
                    return profile != null
                            && profile.getSkills() != null
                            && !profile.getSkills().isEmpty();
                })
                .toList();
    }
}
