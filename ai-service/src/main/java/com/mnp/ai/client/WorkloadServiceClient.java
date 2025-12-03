package com.mnp.ai.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import com.mnp.ai.dto.ApiResponse;
import com.mnp.ai.dto.UserAvailabilityResponse;
import com.mnp.ai.dto.UserWorkloadResponse;

@FeignClient(name = "workload-service", url = "${app.services.workload:http://localhost:8091/workload}")
public interface WorkloadServiceClient {

    @GetMapping("/workloads/{userId}")
    ApiResponse<UserWorkloadResponse> getUserWorkload(@PathVariable String userId);

    @GetMapping("/workloads/{userId}/availability")
    ApiResponse<UserAvailabilityResponse> getUserAvailability(@PathVariable String userId);
}
