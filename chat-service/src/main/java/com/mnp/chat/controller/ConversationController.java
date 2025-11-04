package com.mnp.chat.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.mnp.chat.dto.ApiResponse;
import com.mnp.chat.dto.request.AddParticipantsRequest;
import com.mnp.chat.dto.request.ConversationRequest;
import com.mnp.chat.dto.request.CreateProjectGroupRequest;
import com.mnp.chat.dto.request.RemoveParticipantsRequest;
import com.mnp.chat.dto.response.ConversationResponse;
import com.mnp.chat.service.ChatMessageService;
import com.mnp.chat.service.ConversationService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@RequestMapping("conversations")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {
    ConversationService conversationService;
    ChatMessageService chatMessageService;

    @PostMapping("/create")
    ApiResponse<ConversationResponse> createConversation(@RequestBody @Valid ConversationRequest request) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.create(request))
                .build();
    }

    @GetMapping("/my-conversations")
    ApiResponse<List<ConversationResponse>> myConversations() {
        
        return ApiResponse.<List<ConversationResponse>>builder()
                .result(conversationService.myConversations())
                .build();
    }

    @PostMapping("/{conversationId}/add-members")
    ApiResponse<ConversationResponse> addMembersToGroup(
            @PathVariable String conversationId, @RequestBody @Valid AddParticipantsRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.addMembersToGroup(conversationId, request, userId))
                .build();
    }

    @PostMapping("/{conversationId}/remove-members")
    ApiResponse<ConversationResponse> removeMembersFromGroup(
            @PathVariable String conversationId, @RequestBody @Valid RemoveParticipantsRequest request) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.removeMembersFromGroup(conversationId, request, userId))
                .build();
    }

    @PostMapping("/{conversationId}/leave")
    ApiResponse<Void> leaveGroup(@PathVariable String conversationId) {
        String userId = SecurityContextHolder.getContext().getAuthentication().getName();
        conversationService.leaveGroup(conversationId, userId);
        return ApiResponse.<Void>builder()
                .message("Successfully left the group")
                .build();
    }

    // Project-specific endpoints for automatic chat group creation
    @PostMapping("/project-group")
    ApiResponse<ConversationResponse> createProjectGroup(@RequestBody @Valid CreateProjectGroupRequest request) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.createProjectGroup(request))
                .build();
    }

    @PostMapping("/project-group/{projectId}/add-member/{userId}")
    ApiResponse<ConversationResponse> addMemberToProjectGroup(
            @PathVariable String projectId, @PathVariable String userId) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.addMemberToProjectGroup(projectId, userId))
                .build();
    }

    @PostMapping("/project-group/{projectId}/remove-member/{userId}")
    ApiResponse<ConversationResponse> removeMemberFromProjectGroup(
            @PathVariable String projectId, @PathVariable String userId) {
        return ApiResponse.<ConversationResponse>builder()
                .result(conversationService.removeMemberFromProjectGroup(projectId, userId))
                .build();
    }

    @GetMapping("/project-group/{projectId}/members")
    ApiResponse<List<String>> getProjectGroupMembers(@PathVariable String projectId) {
        return ApiResponse.<List<String>>builder()
                .result(conversationService.getProjectGroupMembers(projectId))
                .build();
    }
}
