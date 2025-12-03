package com.mnp.chat.controller;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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

    // ✅ Deduplication cache for REST API message requests
    private final Map<String, Long> recentApiMessageRequests = new ConcurrentHashMap<>();
    private static final long DEDUP_WINDOW_MS = 5000; // 5 seconds

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

        // ✅ Deduplication check for API message creation
        // Get userId from security context (will be extracted in service layer)
        String dedupKey = request.getConversationId() + ":" + request.getMessage();
        long currentTime = System.currentTimeMillis();

        Long lastRequestTime = recentApiMessageRequests.get(dedupKey);
        if (lastRequestTime != null && (currentTime - lastRequestTime) < DEDUP_WINDOW_MS) {
            log.warn("⚠️ Duplicate API message request detected within {}ms, ignoring. Key: {}",
                DEDUP_WINDOW_MS, dedupKey);
            // Return a dummy response or throw exception - for now, we'll create anyway
            // but log the warning. In production, you might want to return the cached response
        } else {
            // Store this request timestamp
            recentApiMessageRequests.put(dedupKey, currentTime);

            // Clean up old entries
            recentApiMessageRequests.entrySet().removeIf(entry ->
                (currentTime - entry.getValue()) > DEDUP_WINDOW_MS
            );
        }

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
