package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.request.IntrospectRequest;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.dto.response.IntrospectResponse;
import com.mnp.task.dto.response.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "identity-service", url = "${app.services.identity}", configuration = FeignClientConfiguration.class)
public interface IdentityClient {

    @PostMapping("/auth/introspect")
    ApiResponse<IntrospectResponse> introspectToken(@RequestBody IntrospectRequest request);

    @GetMapping("/users/{userId}")
    ApiResponse<UserResponse> getFullName(@PathVariable("userId") String userId);

    @PostMapping("/performance/update")
    ApiResponse<Double> updatePerformanceScore(@RequestBody PerformanceUpdateRequest request);

    /**
     * DTO for performance score update request
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class PerformanceUpdateRequest {
        private String userId;
        private String taskId;
        private Integer qualityRating;
        private boolean completedOnTime;
        private String taskComplexity;
        private Integer estimatedHours;
        private Integer actualHours;
        private String comments;
    }
}
