package com.mnp.project.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.mnp.project.dto.request.ApiResponse;
import com.mnp.project.dto.response.ConversationResponse;
import com.mnp.project.dto.request.CreateProjectGroupRequest;
import com.mnp.project.configuration.FeignConfiguration;

@FeignClient(name = "chat-service", url = "${app.services.chat}", configuration = FeignConfiguration.class)
public interface ChatServiceClient {

    @PostMapping("/conversations/project-group")
    ApiResponse<ConversationResponse> createProjectGroup(@RequestBody CreateProjectGroupRequest request);

    @PostMapping("/conversations/project-group/{projectId}/add-member/{userId}")
    ApiResponse<ConversationResponse> addMemberToProjectGroup(
            @PathVariable String projectId,
            @PathVariable String userId);

    @PostMapping("/conversations/project-group/{projectId}/remove-member/{userId}")
    ApiResponse<ConversationResponse> removeMemberFromProjectGroup(
            @PathVariable String projectId,
            @PathVariable String userId);
}
