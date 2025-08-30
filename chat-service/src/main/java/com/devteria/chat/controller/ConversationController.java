package com.devteria.chat.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.devteria.chat.dto.ApiResponse;
import com.devteria.chat.dto.request.AddParticipantsRequest;
import com.devteria.chat.dto.request.ConversationRequest;
import com.devteria.chat.dto.request.RemoveParticipantsRequest;
import com.devteria.chat.dto.response.ConversationResponse;
import com.devteria.chat.service.ConversationService;
import com.devteria.chat.service.ChatMessageService;

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
}
