package com.mnp.chat.controller;

import com.mnp.chat.service.ConversationService;
import com.mnp.chat.service.ChatMessageService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/chat/internal")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ChatInternalController {

    ConversationService conversationService;
    ChatMessageService chatMessageService;

    /**
     * Called by task-service when a user is assigned to a task
     * Adds user to project group chat with specific system messages
     */
    @PostMapping("/project/{projectId}/add-member")
    public ResponseEntity<Void> addUserToProjectChat(
            @PathVariable String projectId,
            @RequestParam String userId,
            @RequestParam String userName,
            @RequestParam String projectName) {

        log.info("Received request to add user {} ({}) to project {} chat", userId, userName, projectId);

        try {
            // Add user to project group chat using existing logic
            conversationService.addMemberToProjectGroup(projectId, userId);

            log.info("Successfully added user {} to project {} chat with system messages", userId, projectId);
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Failed to add user {} to project {} chat", userId, projectId, e);
            return ResponseEntity.ok().build(); // Don't fail task assignment if chat fails
        }
    }

    @PostMapping("/conversations/project-group/{projectId}/add-member/{userId}")
    public ResponseEntity<Void> addMemberToProjectGroup(
            @PathVariable("projectId") String projectId, @PathVariable("userId") String userId) {

        conversationService.addMemberToProjectGroup(projectId, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversations/project-group/{projectId}/members/{userId}/exists")
    public ResponseEntity<Boolean> isUserInProjectGroup(
            @PathVariable("projectId") String projectId, @PathVariable("userId") String userId) {

        boolean exists = conversationService.isUserInProjectGroup(projectId, userId);
        return ResponseEntity.ok(exists);
    }
}
