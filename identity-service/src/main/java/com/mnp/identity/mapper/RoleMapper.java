package com.mnp.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.mnp.identity.dto.request.RoleRequest;
import com.mnp.identity.dto.response.RoleResponse;
import com.mnp.identity.entity.Role;

@Mapper(componentModel = "spring")
public interface RoleMapper {
    @Mapping(target = "permissions", ignore = true)
    Role toRole(RoleRequest request);

    RoleResponse toRoleResponse(Role role);
}
