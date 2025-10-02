package com.mnp.identity.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.response.PositionResponse;
import com.mnp.identity.dto.response.RoleResponse;
import com.mnp.identity.enums.Permission;
import com.mnp.identity.enums.SeniorityLevel;
import com.mnp.identity.service.PositionService;
import com.mnp.identity.service.RoleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/business-management")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BusinessManagementController {

    PositionService positionService;
    RoleService roleService;

    @GetMapping("/positions")
    ApiResponse<List<PositionResponse>> getAllPositions() {
        return ApiResponse.<List<PositionResponse>>builder()
                .result(positionService.getAllPositions())
                .build();
    }

    @GetMapping("/roles")
    ApiResponse<List<RoleResponse>> getAllRoles() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAllRoles())
                .build();
    }

    @GetMapping("/permissions")
    ApiResponse<Permission[]> getAllPermissions() {
        return ApiResponse.<Permission[]>builder().result(Permission.values()).build();
    }

    @GetMapping("/seniority-levels")
    ApiResponse<SeniorityLevel[]> getAllSeniorityLevels() {
        return ApiResponse.<SeniorityLevel[]>builder()
                .result(SeniorityLevel.values())
                .build();
    }
}
