package com.mnp.post.client;

import com.mnp.post.configuration.FeignClientConfiguration;
import com.mnp.post.dto.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = FeignClientConfiguration.class)
public interface IdentityClient {

    @GetMapping("/internal/users/{userId}")
    ApiResponse<UserResponse> getUser(@PathVariable("userId") String userId);

    @GetMapping("/internal/department/{departmentId}")
    ApiResponse<List<UserResponse>> getUsersByDepartment(@PathVariable("departmentId") String departmentId);

    @GetMapping("/internal/{departmentName}")
    ApiResponse<DepartmentResponse> getDepartment(@PathVariable("departmentName") String departmentName);

    /**
     * DTO for user response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class UserResponse {
        private String id;
        private String username;
        private String firstName;
        private String lastName;
        private String email;
        private String departmentId;
        private String departmentName;
        private boolean active;
    }

    /**
     * DTO for department response
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class DepartmentResponse {
        private String id;
        private String name;
        private String description;
    }
}
