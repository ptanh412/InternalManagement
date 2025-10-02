package com.mnp.identity.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.RoleRequest;
import com.mnp.identity.dto.response.RoleResponse;
import com.mnp.identity.service.RoleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/roles")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleController {
    RoleService roleService;

    @PostMapping
    ApiResponse<RoleResponse> create(@RequestBody RoleRequest request) {
        return ApiResponse.<RoleResponse>builder()
                .result(roleService.create(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<RoleResponse>> getAll() {
        return ApiResponse.<List<RoleResponse>>builder()
                .result(roleService.getAll())
                .build();
    }

    //    @PutMapping("/{role}")
    //    ApiResponse<RoleResponse> updatePermissions(@PathVariable String role, @RequestBody List<String> permissions)
    // {
    //        return ApiResponse.<RoleResponse>builder()
    //                .result(roleService.updatePermissions(role, permissions))
    //                .build();
    //    }

    @DeleteMapping("/{role}")
    ApiResponse<Void> delete(@PathVariable String role) {
        roleService.delete(role);
        return ApiResponse.<Void>builder().build();
    }
}
