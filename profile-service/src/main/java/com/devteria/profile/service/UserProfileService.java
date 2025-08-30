package com.devteria.profile.service;

import com.devteria.profile.dto.request.SearchUserRequest;
import com.devteria.profile.dto.request.UpdateProfileRequest;
import com.devteria.profile.exception.AppException;
import com.devteria.profile.exception.ErrorCode;
import com.devteria.profile.repository.httpclient.FileClient;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.devteria.profile.dto.request.ProfileCreationRequest;
import com.devteria.profile.dto.response.UserProfileResponse;
import com.devteria.profile.entity.UserProfile;
import com.devteria.profile.mapper.UserProfileMapper;
import com.devteria.profile.repository.UserProfileRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserProfileService {
    UserProfileRepository userProfileRepository;
    FileClient fileClient;

    UserProfileMapper userProfileMapper;

    public UserProfileResponse createProfile(ProfileCreationRequest request) {
        log.info("Creating profile for userId: {}", request.getUserId());
        UserProfile userProfile = userProfileMapper.toUserProfile(request);
        userProfile = userProfileRepository.save(userProfile);
        log.info("Profile created successfully with ID: {} for userId: {}", userProfile.getId(), userProfile.getUserId());

        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse getByUserId(String userId) {
        log.info("Looking up profile for userId: {}", userId);
        UserProfile userProfile =
                userProfileRepository.findByUserId(userId)
                        .orElseThrow(() -> {
                            log.error("Profile not found for userId: {}", userId);
                            return new AppException(ErrorCode.USER_NOT_EXISTED);
                        });

        log.info("Profile found: {} for userId: {}", userProfile.getId(), userId);
        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    public UserProfileResponse getProfile(String id) {
        UserProfile userProfile =
                userProfileRepository.findById(id).orElseThrow(
                        () -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userProfileMapper.toUserProfileResponse(userProfile);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileResponse> getAllProfiles() {
        var profiles = userProfileRepository.findAll();

        return profiles.stream().map(userProfileMapper::toUserProfileResponse).toList();
    }

    public UserProfileResponse getMyProfile() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        return userProfileMapper.toUserProfileResponse(profile);
    }

    public UserProfileResponse updateMyProfile(UpdateProfileRequest request) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        userProfileMapper.update(profile, request);

        return userProfileMapper.toUserProfileResponse(userProfileRepository.save(profile));
    }

    public UserProfileResponse updateAvatar(MultipartFile file) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication.getName();

        var profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        var response = fileClient.uploadMedia(file);

        profile.setAvatar(response.getResult().getUrl());

        return userProfileMapper.toUserProfileResponse(userProfileRepository.save(profile));
    }

    public List<UserProfileResponse> search(SearchUserRequest request) {
        var userId = SecurityContextHolder.getContext().getAuthentication().getName();
        List<UserProfile> userProfiles = userProfileRepository.findAllByUsernameLike(request.getKeyword());
        return userProfiles.stream()
                .filter(userProfile -> !userId.equals(userProfile.getUserId()))
                .map(userProfileMapper::toUserProfileResponse)
                .toList();
    }

    // Debug method to help troubleshoot admin profile issue
    public List<UserProfile> getAllProfilesForDebug() {
        log.info("Debug: Getting all profiles from database");
        List<UserProfile> profiles = userProfileRepository.findAll();
        log.info("Debug: Found {} profiles in database", profiles.size());
        for (UserProfile profile : profiles) {
            log.info("Debug: Profile - ID: {}, UserID: {}, Username: {}, Email: {}",
                    profile.getId(), profile.getUserId(), profile.getUsername(), profile.getEmail());
        }
        return profiles;
    }
}
