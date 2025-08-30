package com.devteria.identity.controller;

import java.util.List;

import com.devteria.identity.dto.request.UserStatusUpdateRequest;
import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.UserCreationRequest;
import com.devteria.identity.dto.request.UserUpdateRequest;
import com.devteria.identity.dto.response.UserResponse;
import com.devteria.identity.service.UserService;

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

    @PostMapping("/registration")
    ApiResponse<UserResponse> createUser(@RequestBody @Valid UserCreationRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUser(request))
                .build();
    }
    @PostMapping("/{userId}/status")
    public ApiResponse<Void> updateUserStatus(@PathVariable("userId") String userId, @RequestBody UserStatusUpdateRequest request) {
        userService.updateUserStatus(userId, request);
        return ApiResponse.<Void>builder().result(null).build();
    }
    //    @PostMapping("/admin-creation")
    //    ApiResponse<UserResponse> createAdminUser(@RequestBody @Valid AdminUserCreationRequest request) {
    //        log.info("Admin user creation request received for username: {}", request.getUsername());
    //        return ApiResponse.<UserResponse>builder()
    //                .result(userService.createAdminUser(request))
    //                .build();
    //    }

    @PostMapping("/admin/create")
    ApiResponse<UserResponse> createUserByAdmin(@RequestBody @Valid UserCreationRequest request) {
        log.info("Admin user creation request received for username: {}", request.getUsername());
        return ApiResponse.<UserResponse>builder()
                .result(userService.createUserByAdmin(request))
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

    @PutMapping("/{userId}")
    ApiResponse<UserResponse> updateUser(
            @PathVariable("userId") String userId, @RequestBody UserUpdateRequest request) {
        return ApiResponse.<UserResponse>builder()
                .result(userService.updateUser(userId, request))
                .build();
    }
}
