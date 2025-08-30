package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.UserCreationRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.entity.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "emailVerified", constant = "false")
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "joinDate", expression = "java(java.time.LocalDateTime.now())")
    @Mapping(target = "isActive", constant = "true")
    User toUser(UserCreationRequest request);

    @Mapping(
            target = "departmentId",
            expression = "java(user.getDepartment() != null ? user.getDepartment().getId() : null)")
    @Mapping(
            target = "departmentName",
            expression = "java(user.getDepartment() != null ? user.getDepartment().getName() : null)")
    @Mapping(
            target = "businessRoleDisplayName",
            expression = "java(user.getBusinessRole() != null ? user.getBusinessRole().getDisplayName() : null)")
    @Mapping(target = "online", source = "online")
    @Mapping(target = "lastLogin", source = "lastLogin")
    UserResponse toUserResponse(User user);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "username", ignore = true)
    @Mapping(target = "email", ignore = true)
    @Mapping(target = "emailVerified", ignore = true)
    @Mapping(target = "roles", ignore = true)
    @Mapping(target = "department", ignore = true)
    @Mapping(target = "joinDate", ignore = true)
    @Mapping(target = "online", source = "online")
    @Mapping(target = "lastLogin", source = "lastLogin")
    void updateUser(@MappingTarget User user, UserUpdateRequest request);
}
