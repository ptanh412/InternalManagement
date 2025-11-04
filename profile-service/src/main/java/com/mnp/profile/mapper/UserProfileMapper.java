package com.mnp.profile.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.mnp.profile.dto.request.ProfileCreationRequest;
import com.mnp.profile.dto.request.UpdateProfileRequest;
import com.mnp.profile.dto.response.UserProfileResponse;
import com.mnp.profile.entity.UserProfile;

@Mapper(
        componentModel = "spring",
        uses = {UserSkillMapper.class})
public interface UserProfileMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "averageTaskCompletionRate", constant = "0.0")
    @Mapping(target = "totalTasksCompleted", constant = "0")
    @Mapping(target = "currentWorkLoadHours", constant = "0")
    UserProfile toUserProfile(ProfileCreationRequest request);

    @Mapping(target = "user", ignore = true) // User data will be set separately from identity-service
    UserProfileResponse toUserProfileResponse(UserProfile entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "averageTaskCompletionRate", ignore = true)
    @Mapping(source = "avatar", target = "avatar") // Thêm dòng này
    @Mapping(target = "totalTasksCompleted", ignore = true)
    void update(@MappingTarget UserProfile entity, UpdateProfileRequest request);
}
