package com.mnp.profile.repository.httpclient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mnp.profile.config.InternalFeignConfig;
import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.response.TaskMetricsResponse;

@FeignClient(name = "task-service", url = "${app.services.task}", configuration = InternalFeignConfig.class)
public interface TaskServiceClient {

    @GetMapping("/internal/users/{userId}/metrics")
    ApiResponse<TaskMetricsResponse> getUserTaskMetrics(@PathVariable String userId);
}

