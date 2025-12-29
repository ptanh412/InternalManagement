package com.mnp.identity.controller;

import com.mnp.identity.dto.response.DepartmentResponse;
import com.mnp.identity.service.DepartmentService;
import org.springframework.web.bind.annotation.*;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.response.UserResponse;
import com.mnp.identity.service.UserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InternalController {
    UserService userService;
    DepartmentService departmentService;
    @GetMapping("/{departmentName}")
    ApiResponse<DepartmentResponse> getDepartmentByName(@PathVariable("departmentName") String departmentName) {
        return ApiResponse.<DepartmentResponse>builder()
                .result(departmentService.getDepartmentByName(departmentName))
                .build();
    }
    @GetMapping("/department/{departmentName}")
    ApiResponse<List<UserResponse>> getUsersByDepartment(@PathVariable String departmentName) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsersByDepartment(departmentName))
                .build();
    }
    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        log.info("Internal call: Getting user with ID: {}", userId);
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserForInternalService(userId))
                .build();
    }

    @GetMapping("/users/{userId}/detailed")
    ApiResponse<UserResponse> getUserDetailed(@PathVariable("userId") String userId) {
        log.info("Internal call: Getting detailed user with ID: {}", userId);
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUserDetailed(userId))
                .build();
    }
}
