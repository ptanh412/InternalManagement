package com.mnp.identity.repository.httpclient;

import com.mnp.identity.dto.request.ApiResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;


@FeignClient(name = "task-service", url = "${app.services.task}")
public interface TaskServiceClient {

    @GetMapping("/internal/users/{userId}/metrics")
    ApiResponse<TaskMetricsResponse> getUserTaskMetrics(@PathVariable("userId") String userId);

    /**
     * Task metrics response from task service
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    class TaskMetricsResponse {
        private int totalTasks;
        private int completedTasks;
        private Double averageQualityRating;
        private Double onTimeCompletionRate;
        private Double averageTaskDuration;
        private Double estimatedActualRatio;
    }
}