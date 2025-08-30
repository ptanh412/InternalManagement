package com.devteria.identity.controller;

import java.util.List;
import java.util.Set;

import org.springframework.web.bind.annotation.*;

import com.devteria.identity.configuration.BusinessRolePermissionConfig;
import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.entity.BusinessPermission;
import com.devteria.identity.entity.BusinessRole;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/business-management")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BusinessManagementController {

    BusinessRolePermissionConfig businessRolePermissionConfig;

    @GetMapping("/roles")
    ApiResponse<List<BusinessRole>> getAllBusinessRoles() {
        List<BusinessRole> roles = businessRolePermissionConfig.getRolePermissions().entrySet().stream()
                .map(entry -> {
                    Set<BusinessPermission> permissions = entry.getValue().stream()
                            .map(permName -> {
                                BusinessPermission permission = new BusinessPermission();
                                permission.setName(permName);
                                permission.setDescription(permName.replace("_", " "));
                                return permission;
                            })
                            .collect(java.util.stream.Collectors.toSet());

                    BusinessRole role = new BusinessRole();
                    role.setName(entry.getKey());
                    role.setPermissions(permissions);
                    return role;
                })
                .toList();

        return ApiResponse.<List<BusinessRole>>builder().result(roles).build();
    }

    @GetMapping("/permissions")
    ApiResponse<List<BusinessPermission>> getAllBusinessPermissions() {
        List<BusinessPermission> permissions = businessRolePermissionConfig.getRolePermissions().values().stream()
                .flatMap(java.util.Set::stream)
                .distinct()
                .map(permName -> {
                    BusinessPermission permission = new BusinessPermission();
                    permission.setName(permName);
                    permission.setDescription(permName.replace("_", " "));
                    return permission;
                })
                .toList();

        return ApiResponse.<List<BusinessPermission>>builder()
                .result(permissions)
                .build();
    }
}
