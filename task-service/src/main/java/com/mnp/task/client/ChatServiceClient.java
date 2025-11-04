package com.mnp.task.client;

import com.mnp.task.configuration.FeignClientConfiguration;
import com.mnp.task.dto.response.ApiResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(name = "chat-service", url = "${app.services.chat}", configuration = FeignClientConfiguration.class)
public interface ChatServiceClient {

    @PostMapping("/conversations/project-group/{projectId}/add-member/{userId}")
    ApiResponse<Void> addMemberToProjectGroup(
            @PathVariable("projectId") String projectId,
            @PathVariable("userId") String userId);

    @GetMapping("/conversations/project-group/{projectId}/members/{userId}/exists")
    ApiResponse<Boolean> isUserInProjectGroup(
            @PathVariable("projectId") String projectId,
            @PathVariable("userId") String userId);
}
