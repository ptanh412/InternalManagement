package com.mnp.assignment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import com.mnp.assignment.dto.request.ApiResponse;
import com.mnp.assignment.dto.response.ConversationResponse;

@FeignClient(name = "chat-service", url = "${app.services.chat}")
public interface ChatServiceClient {

    @PostMapping("/conversations/project-group/{projectId}/add-member/{userId}")
    ApiResponse<ConversationResponse> addMemberToProjectGroup(
            @PathVariable String projectId,
            @PathVariable String userId);

    @PostMapping("/conversations/project-group/{projectId}/remove-member/{userId}")
    ApiResponse<ConversationResponse> removeMemberFromProjectGroup(
            @PathVariable String projectId,
            @PathVariable String userId);
}
