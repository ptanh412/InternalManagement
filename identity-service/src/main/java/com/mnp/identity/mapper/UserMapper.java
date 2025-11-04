package com.mnp.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.mnp.identity.dto.request.UserCreationRequest;
import com.mnp.identity.dto.request.UserUpdateRequest;
import com.mnp.identity.dto.response.UserResponse;
import com.mnp.identity.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "emailVerified", constant = "false")
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "online", constant = "false")
    @Mapping(target = "lastLogin", ignore = true)
    @Mapping(target = "performanceScore", constant = "70.0")
    User toUser(UserCreationRequest request);

    @Mapping(
            target = "departmentName",
            expression = "java(user.getDepartment() != null ? user.getDepartment().getName() : null)")
    @Mapping(
            target = "roleDescription",
            expression = "java(user.getRole() != null ? user.getRole().getDescription() : null)")
    @Mapping(
            target = "positionTitle",
            expression = "java(user.getPosition() != null ? user.getPosition().getTitle() : null)")
    @Mapping(target = "roleName", expression = "java(user.getRole() != null ? user.getRole().getName() : null)")
    @Mapping(
            target = "seniorityLevel",
            expression = "java(user.getPosition() != null ? user.getPosition().getSeniorityLevel().name() : null)")
    @Mapping(target = "isActive", source = "active")
    UserResponse toUserResponse(User user);

    // Detailed response with full entity information
    @Mapping(
            target = "departmentName",
            expression = "java(user.getDepartment() != null ? user.getDepartment().getName() : null)")
    @Mapping(
            target = "positionTitle",
            expression = "java(user.getPosition() != null ? user.getPosition().getTitle() : null)")
    @Mapping(
            target = "seniorityLevel",
            expression = "java(user.getPosition() != null ? user.getPosition().getSeniorityLevel().name() : null)")
    @Mapping(target = "roleName", expression = "java(user.getRole() != null ? user.getRole().getName() : null)")
    @Mapping(
            target = "roleDescription",
            expression = "java(user.getRole() != null ? user.getRole().getDescription() : null)")
    @Mapping(target = "isActive", source = "active")
    UserResponse toUserDetailedResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "password", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "role", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", expression = "java(java.time.LocalDateTime.now())")
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
