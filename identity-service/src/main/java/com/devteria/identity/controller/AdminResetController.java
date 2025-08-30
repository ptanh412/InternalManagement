package com.devteria.identity.controller;

import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.service.AdminResetService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/admin-reset")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
@Profile("admin-reset")
public class AdminResetController {

    AdminResetService adminResetService;

    @PostMapping("/reset")
    public ApiResponse<String> resetAdminAccount() {
        try {
            log.warn("Manual admin reset initiated via API");
            adminResetService.run();

            return ApiResponse.<String>builder()
                    .code(200)
                    .message("Admin account reset successfully")
                    .result("Admin account has been reset with full business management attributes. "
                            + "Username: admin, Password: Admin@123456, Role: DIRECTOR")
                    .build();
        } catch (Exception e) {
            log.error("Admin reset failed: ", e);
            return ApiResponse.<String>builder()
                    .code(500)
                    .message("Admin reset failed: " + e.getMessage())
                    .build();
        }
    }

    @GetMapping("/status")
    public ApiResponse<String> getAdminStatus() {
        // This endpoint can be used to check if admin exists and has proper attributes
        return ApiResponse.<String>builder()
                .code(200)
                .message("Admin reset service is available")
                .result("Use POST /admin-reset/reset to reset admin account with full business attributes")
                .build();
    }
}
