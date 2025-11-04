package com.mnp.chat.controller;

import java.util.List;

import jakarta.validation.Valid;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.mnp.chat.dto.ApiResponse;
import com.mnp.chat.dto.request.ChatMessageRequest;
import com.mnp.chat.dto.response.ChatMessageResponse;
import com.mnp.chat.service.ChatMessageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequiredArgsConstructor
@RequestMapping("messages")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ChatMessageController {
    ChatMessageService chatMessageService;

    @GetMapping
    ApiResponse<List<ChatMessageResponse>> getMessages(@RequestParam("conversationId") String conversationId) {
        return ApiResponse.<List<ChatMessageResponse>>builder()
                .result(chatMessageService.getMessages(conversationId))
                .build();
    }

    @PostMapping("/create")
    ApiResponse<ChatMessageResponse> create(@RequestBody @Valid ChatMessageRequest request)
            throws JsonProcessingException {
        log.info("🔵 API /create called - conversationId: {}, message: {}",
                request.getConversationId(),
                request.getMessage().substring(0, Math.min(20, request.getMessage().length()))
        );
        return ApiResponse.<ChatMessageResponse>builder()
                .result(chatMessageService.create(request))
                .build();
    }

    @PutMapping("/mark-as-read")
    ApiResponse<Void> markMessagesAsRead(@RequestParam("conversationId") String conversationId) {
        chatMessageService.markMessagesAsRead(conversationId);
        return ApiResponse.<Void>builder().build();
    }
}
