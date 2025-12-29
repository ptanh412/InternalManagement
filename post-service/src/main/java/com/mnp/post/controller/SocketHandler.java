package com.mnp.post.controller;

import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.mnp.post.entity.Post;
import com.mnp.post.entity.Reaction;
import com.mnp.post.repository.PostRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

import org.springframework.stereotype.Component;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.mnp.post.dto.request.CommentRequest;
import com.mnp.post.dto.request.PostRequest;
import com.mnp.post.dto.request.ReactionRequest;
import com.mnp.post.dto.response.CommentResponse;
import com.mnp.post.dto.response.PostResponse;
import com.mnp.post.dto.response.ReactionResponse;
import com.mnp.post.service.CommentService;
import com.mnp.post.service.PostService;
import com.mnp.post.service.ReactionService;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SocketHandler {
    SocketIOServer server;
    PostService postService;
    CommentService commentService;
    ReactionService reactionService;
    PostRepository postRepository;

    @NonFinal
    @Value("${jwt.signerKey}")
    protected String SIGNER_KEY;


    // ✅ Track processed request IDs (expire after 10 seconds)
    private final Cache<String, Boolean> processedRequests = CacheBuilder.newBuilder()
            .expireAfterWrite(10, TimeUnit.SECONDS)
            .maximumSize(1000)
            .build();

    // Helper method to check and mark request as processed
    private boolean isAlreadyProcessed(String requestId) {
        if (requestId == null || requestId.isEmpty()) {
            return false; // Allow if no requestId (backward compatibility)
        }

        if (processedRequests.getIfPresent(requestId) != null) {
            log.warn("⚠️ Duplicate request detected, ignoring: {}", requestId);
            return true;
        }

        processedRequests.put(requestId, true);
        return false;
    }
    @PostConstruct
    public void startServer() {
        server.start();
        server.addListeners(this);
        log.info("Socket.IO server started on port: {}", server.getConfiguration().getPort());
    }

    @PreDestroy
    public void stopServer() {
        server.stop();
        log.info("Socket.IO server stopped");
    }

    @OnConnect
    public void clientConnected(SocketIOClient client) {
        log.info("Client connected: {}", client.getSessionId());
        String token = client.getHandshakeData().getSingleUrlParam("token");
        
        if (token != null && !token.isEmpty()) {
            try {
                String userId = verifyToken(token);
                client.set("userId", userId);
                log.info("User {} authenticated via Socket.IO", userId);
            } catch (Exception e) {
                log.error("Token validation failed for client {}: {}", client.getSessionId(), e.getMessage());
                client.disconnect();
            }
        } else {
            log.warn("Client connected without token");
            // Optionally disconnect clients without tokens
            // client.disconnect();
        }
    }
    
    /**
     * Verify JWT token and extract userId
     */
    private String verifyToken(String token) throws Exception {
        SignedJWT signedJWT = SignedJWT.parse(token);
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        
        if (!signedJWT.verify(verifier)) {
            throw new Exception("Invalid token signature");
        }
        
        // Check expiration
        java.util.Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        if (expirationTime != null && expirationTime.before(new java.util.Date())) {
            throw new Exception("Token expired");
        }
        
        return signedJWT.getJWTClaimsSet().getSubject();
    }
    
    /**
     * Get authenticated userId from client
     */
    private String getUserId(SocketIOClient client) {
        String userId = client.get("userId");
        if (userId == null) {
            throw new RuntimeException("User not authenticated");
        }
        return userId;
    }

    @OnDisconnect
    public void clientDisconnected(SocketIOClient client) {
        log.info("Client disconnected: {}", client.getSessionId());
    }

    // Post events
    @OnEvent("post:create")
    public void onCreatePost(SocketIOClient client, PostRequest request) {
        log.info("Creating post via socket from client: {} | Session: {}",
                client.getRemoteAddress(), client.getSessionId());
        log.info("Request: {}", request);

        try {
            // ✅ Check if already processed
            if (request.getRequestId() != null) {
                if (processedRequests.getIfPresent(request.getRequestId()) != null) {
                    log.warn("⚠️ Duplicate request detected, ignoring: {}", request.getRequestId());
                    return;
                }
                // Mark as processed
                processedRequests.put(request.getRequestId(), true);
            }

            String userId = getUserId(client);
            PostResponse response = postService.createPostWithUserId(request, userId);

            if (response.getDepartmentId() != null) {
                log.info("Broadcasting to room: department:{}", response.getDepartmentId());
                server.getRoomOperations("department:" + response.getDepartmentId())
                        .sendEvent("post:created", response);
            } else {
                client.sendEvent("post:created", response);
            }
        } catch (Exception e) {
            log.error("Error creating post", e);
            client.sendEvent("post:error", e.getMessage());
        }
    }

    @OnEvent("post:update")
    public void onUpdatePost(SocketIOClient client, PostRequest request, String postId) {
        log.info("Updating post {} via socket from client: {} | Session: {}",
                postId, client.getRemoteAddress(), client.getSessionId());
        log.info("Request: {}", request);

        try {
            // ✅ Check if already processed
            if (request.getRequestId() != null && isAlreadyProcessed(request.getRequestId())) {
                return;
            }

            String userId = getUserId(client);
            PostResponse response = postService.updatePostWithUserId(postId, request, userId);

            // ✅ Set requestId in response
            if (request.getRequestId() != null) {
                response.setRequestId(request.getRequestId());
            }

            // ✅ Broadcast to department room (users viewing department feed)
            if (response.getDepartmentId() != null) {
                String departmentRoom = "department:" + response.getDepartmentId();
                log.info("Broadcasting post:updated to room: {}", departmentRoom);
                server.getRoomOperations(departmentRoom)
                        .sendEvent("post:updated", response);
            }

            // ✅ Broadcast to post room (users viewing this specific post)
            String postRoom = "post:" + postId;
            log.info("Broadcasting post:updated to room: {}", postRoom);
            server.getRoomOperations(postRoom)
                    .sendEvent("post:updated", response);

            // ❌ REMOVE: Không gửi riêng cho client
            // client.sendEvent("post:updated", response);

        } catch (Exception e) {
            log.error("Error updating post", e);
            client.sendEvent("post:error", e.getMessage());
        }
    }

    @OnEvent("post:delete")
    public void onDeletePost(SocketIOClient client, String postId) {
        log.info("Deleting post {} via socket from client: {} | Session: {}",
                postId, client.getRemoteAddress(), client.getSessionId());

        try {
            String userId = getUserId(client);

            // ✅ Get departmentId BEFORE deleting
            String departmentId = postService.getPostDepartmentId(postId);

            // Delete the post
            postService.deletePostWithUserId(postId, userId);

            // ✅ Create response object với postId và departmentId
            Map<String, String> deleteResponse = Map.of(
                    "postId", postId,
                    "departmentId", departmentId != null ? departmentId : ""
            );

            // ✅ Broadcast to department room (users viewing department feed)
            if (departmentId != null) {
                String departmentRoom = "department:" + departmentId;
                log.info("Broadcasting post:deleted to room: {}", departmentRoom);
                server.getRoomOperations(departmentRoom)
                        .sendEvent("post:deleted", deleteResponse);
            }

            // ✅ Broadcast to post room (users viewing this specific post detail)
            String postRoom = "post:" + postId;
            log.info("Broadcasting post:deleted to room: {}", postRoom);
            server.getRoomOperations(postRoom)
                    .sendEvent("post:deleted", deleteResponse);

            // ❌ REMOVE: Không gửi riêng cho client
            // client.sendEvent("post:deleted", postId);

        } catch (Exception e) {
            log.error("Error deleting post", e);
            client.sendEvent("post:error", e.getMessage());
        }
    }

    // Comment events
    @OnEvent("comment:create")
    public void onCreateComment(SocketIOClient client, CommentRequest request) {
        log.info("Creating comment via socket from client: {} | Session: {}",
                client.getRemoteAddress(), client.getSessionId());
        log.info("Request: {}", request);

        try {
            // ✅ Check if already processed
            if (isAlreadyProcessed(request.getRequestId())) {
                return;
            }

            String userId = getUserId(client);
            CommentResponse response = commentService.createCommentWithUserId(request, userId);

            // ✅ Set requestId in response for frontend verification
            response.setRequestId(request.getRequestId());

            // ✅ Broadcast to post room (users viewing the post)
            String postRoomName = "post:" + request.getPostId();
            log.info("Broadcasting comment:created to room: {}", postRoomName);
            server.getRoomOperations(postRoomName)
                    .sendEvent("comment:created", response);

            // ✅ THÊM: Broadcast to department room (users viewing department feed)
            // Fetch post to get departmentId
            Post post = postRepository.findById(request.getPostId()).orElse(null);
            if (post != null && post.getDepartmentId() != null) {
                String departmentRoom = "department:" + post.getDepartmentId();
                log.info("Broadcasting comment:created to department room: {}", departmentRoom);
                server.getRoomOperations(departmentRoom)
                        .sendEvent("comment:created", response);
            }

        } catch (Exception e) {
            log.error("Error creating comment", e);
            client.sendEvent("comment:error", e.getMessage());
        }
    }

    // ✅ Updated handler
    @OnEvent("comment:update")
    public void onUpdateComment(SocketIOClient client, CommentRequest request) {
        log.info("Updating comment via socket from client: {} | Session: {}",
                client.getRemoteAddress(), client.getSessionId());
        log.info("Request: {}", request);

        try {
            // ✅ Check if already processed
            if (request.getRequestId() != null && isAlreadyProcessed(request.getRequestId())) {
                return;
            }

            String userId = getUserId(client);

            // Create CommentRequest for service layer
            CommentRequest commentRequest = CommentRequest.builder()
                    .content(request.getContent())
                    .postId(request.getPostId())
                    .parentCommentId(request.getParentCommentId())
                    .requestId(request.getRequestId())
                    .build();

            CommentResponse response = commentService.updateCommentWithUserId(
                    request.getCommentId(),
                    commentRequest,
                    userId
            );

            // ✅ Set requestId in response
            response.setRequestId(request.getRequestId());

            // ✅ Broadcast to post room
            String postRoom = "post:" + response.getPostId();
            log.info("Broadcasting comment:updated to room: {}", postRoom);
            server.getRoomOperations(postRoom)
                    .sendEvent("comment:updated", response);

            // ✅ Broadcast to department room
            Post post = postRepository.findById(response.getPostId()).orElse(null);
            if (post != null && post.getDepartmentId() != null) {
                String departmentRoom = "department:" + post.getDepartmentId();
                log.info("Broadcasting comment:updated to department room: {}", departmentRoom);
                server.getRoomOperations(departmentRoom)
                        .sendEvent("comment:updated", response);
            }

        } catch (Exception e) {
            log.error("Error updating comment", e);
            client.sendEvent("comment:error", e.getMessage());
        }
    }

    @OnEvent("comment:delete")
    public void onDeleteComment(SocketIOClient client, String commentId) {
        log.info("Deleting comment {} via socket from client: {} | Session: {}",
                commentId, client.getRemoteAddress(), client.getSessionId());

        try {
            String userId = getUserId(client);

            // ✅ Get postId and departmentId BEFORE deleting
            String postId = commentService.getCommentPostId(commentId);
            String departmentId = null;

            if (postId != null) {
                Post post = postRepository.findById(postId).orElse(null);
                if (post != null) {
                    departmentId = post.getDepartmentId();
                }
            }

            // Delete the comment
            commentService.deleteCommentWithUserId(commentId, userId);

            // ✅ Create response object
            Map<String, String> deleteResponse = Map.of(
                    "commentId", commentId,
                    "postId", postId != null ? postId : "",
                    "departmentId", departmentId != null ? departmentId : ""
            );

            // ✅ Broadcast to post room (users viewing this post)
            if (postId != null) {
                String postRoom = "post:" + postId;
                log.info("Broadcasting comment:deleted to room: {}", postRoom);
                server.getRoomOperations(postRoom)
                        .sendEvent("comment:deleted", deleteResponse);
            }

            // ✅ Broadcast to department room (users viewing department feed)
            if (departmentId != null) {
                String departmentRoom = "department:" + departmentId;
                log.info("Broadcasting comment:deleted to department room: {}", departmentRoom);
                server.getRoomOperations(departmentRoom)
                        .sendEvent("comment:deleted", deleteResponse);
            }

            // ❌ REMOVE: Không gửi riêng cho client
            // client.sendEvent("comment:deleted", commentId);

        } catch (Exception e) {
            log.error("Error deleting comment", e);
            client.sendEvent("comment:error", e.getMessage());
        }
    }

    @OnEvent("reaction:toggle")
    public void onToggleReaction(SocketIOClient client, ReactionRequest request) {
        log.info("Toggling reaction via socket from client: {} | Session: {}",
                client.getRemoteAddress(), client.getSessionId());
        log.info("Request: {}", request);

        try {
            // ✅ Check if already processed
            if (isAlreadyProcessed(request.getRequestId())) {
                return;
            }

            String userId = getUserId(client);
            ReactionResponse response = reactionService.toggleReactionWithUserId(request, userId);

            // ✅ Set requestId in response for frontend verification
            response.setRequestId(request.getRequestId());

            // ✅ Broadcast to post room (chi tiết post)
            String postRoomName = request.getTargetType() == Reaction.TargetType.POST
                    ? "post:" + request.getTargetId()
                    : "comment:" + request.getTargetId();

            log.info("Broadcasting reaction:toggled to room: {}", postRoomName);
            server.getRoomOperations(postRoomName)
                    .sendEvent("reaction:toggled", response);

            // ✅ THÊM: Broadcast to department room (feed view)
            if (request.getTargetType() == Reaction.TargetType.POST) {
                // Fetch post to get departmentId
                Post post = postRepository.findById(request.getTargetId()).orElse(null);
                if (post != null && post.getDepartmentId() != null) {
                    String departmentRoom = "department:" + post.getDepartmentId();
                    log.info("Broadcasting reaction:toggled to department room: {}", departmentRoom);
                    server.getRoomOperations(departmentRoom)
                            .sendEvent("reaction:toggled", response);
                }
            }

        } catch (Exception e) {
            log.error("Error toggling reaction", e);
            client.sendEvent("reaction:error", e.getMessage());
        }
    }


    // Room management
    @OnEvent("room:join")
    public void onJoinRoom(SocketIOClient client, String roomId) {
        log.info("Client {} joining room {}", client.getSessionId(), roomId);
        client.joinRoom(roomId);
    }

    @OnEvent("room:leave")
    public void onLeaveRoom(SocketIOClient client, String roomId) {
        log.info("Client {} leaving room {}", client.getSessionId(), roomId);
        client.leaveRoom(roomId);
    }
}

