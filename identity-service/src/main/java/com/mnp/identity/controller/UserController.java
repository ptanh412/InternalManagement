package com.mnp.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.ChangePasswordRequest;
import com.mnp.identity.dto.request.UserCreationRequest;
import com.mnp.identity.dto.request.UserStatusUpdateRequest;
import com.mnp.identity.dto.request.UserUpdateRequest;
import com.mnp.identity.dto.response.UserResponse;
import com.mnp.identity.service.UserService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UserController {
    UserService userService;

    @PostMapping
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        log.info("Creating user with username: {}", request.getUsername());
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }

    @PostMapping("/{userId}/status")
    public ApiResponse<Void> updateUserStatus(
            @PathVariable("userId") String userId, @RequestBody UserStatusUpdateRequest request) {
        userService.updateUserStatus(userId, request);
        return ApiResponse.<Void>builder().result(null).build();
    }

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(
            @PathVariable("userId") String userId, @RequestBody UserUpdateRequest request) {
        log.info("Updating user with ID: {}", userId);
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }

    @GetMapping
    ApiResponse<List<UserResponse>> getUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsers())
                .build();
    }

    @GetMapping("/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getUser(userId))
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(userService.getMyInfo())
                .build();
    }

    @DeleteMapping("/{userId}")
    ApiResponse<String> deleteUser(@PathVariable String userId) {
        userService.deleteUser(userId);
        return ApiResponse.<String>builder().result("User has been deleted").build();
    }

    // Additional endpoints for enhanced user management

    @GetMapping("/department/{departmentId}")
    ApiResponse<List<UserResponse>> getUsersByDepartment(@PathVariable String departmentId) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsersByDepartment(departmentId))
                .build();
    }

    @GetMapping("/active")
    ApiResponse<List<UserResponse>> getActiveUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getActiveUsers())
                .build();
    }

    @GetMapping("/inactive")
    ApiResponse<List<UserResponse>> getInactiveUsers() {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getInactiveUsers())
                .build();
    }

    @GetMapping("/role/{roleName}")
    ApiResponse<List<UserResponse>> getUsersByRole(@PathVariable String roleName) {
        return ApiResponse.<List<UserResponse>>builder()
                .result(userService.getUsersByRole(roleName))
                .build();
    }

    @PostMapping("/change-password")
    ApiResponse<Void> changePassword(@RequestBody @Valid ChangePasswordRequest request) {
        userService.changePassword(request);
        return ApiResponse.<Void>builder().result(null).build();
    }
}
