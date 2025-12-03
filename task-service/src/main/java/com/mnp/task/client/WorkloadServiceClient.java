package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.request.AddTaskToWorkloadRequest;
import com.mnp.task.dto.request.UpdateTaskWorkloadRequest;
import com.mnp.task.dto.response.ApiResponse;
import com.mnp.task.dto.response.UserCurrentTaskResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "workload-service", url = "${app.services.workload}", configuration = FeignClientConfiguration.class)
public interface WorkloadServiceClient {

    @PostMapping("/workloads/tasks")
    ApiResponse<UserCurrentTaskResponse> addTaskToWorkload(
            @RequestParam("userId") String userId,
            @RequestBody AddTaskToWorkloadRequest request
    );

    @PutMapping("/workloads/tasks/{taskId}")
    ApiResponse<UserCurrentTaskResponse> updateTaskWorkload(
            @PathVariable("taskId") String taskId,
            @RequestBody UpdateTaskWorkloadRequest request
    );

    @DeleteMapping("/workloads/tasks/{taskId}")
    ApiResponse<Void> removeTaskFromWorkload(@PathVariable("taskId") String taskId);
}
