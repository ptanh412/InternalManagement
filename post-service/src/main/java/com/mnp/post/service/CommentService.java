package com.mnp.post.service;

import com.mnp.post.dto.request.CommentRequest;
import com.mnp.post.dto.response.CommentResponse;
import com.mnp.post.dto.response.UserProfileResponse;
import com.mnp.post.entity.Comment;
import com.mnp.post.entity.Post;
import com.mnp.post.exception.AppException;
import com.mnp.post.exception.ErrorCode;
import com.mnp.post.repository.CommentRepository;
import com.mnp.post.repository.PostRepository;
import com.mnp.post.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentService {
    CommentRepository commentRepository;
    PostRepository postRepository;
    ProfileClient profileClient;

    public CommentResponse createComment(CommentRequest request){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return createCommentWithUserId(request, authentication.getName());
    }
    
    /**
     * Create comment with explicit userId (for Socket.IO)
     */
    public CommentResponse createCommentWithUserId(CommentRequest request, String userId){
        Comment comment = Comment.builder()
                .postId(request.getPostId())
                .userId(userId)
                .content(request.getContent())
                .parentCommentId(request.getParentCommentId())
                .createdDate(Instant.now())
                .modifiedDate(Instant.now())
                .reactionCount(0)
                .build();

        comment = commentRepository.save(comment);

        // Increment post comment count
        incrementPostCommentCount(request.getPostId());

        CommentResponse response =  toCommentResponse(comment);
        response.setRequestId(request.getRequestId());
        return response;
    }

    public CommentResponse updateComment(String commentId, CommentRequest request){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return updateCommentWithUserId(commentId, request, authentication.getName());
    }
    
    /**
     * Update comment with explicit userId (for Socket.IO)
     */
    public CommentResponse updateCommentWithUserId(String commentId, CommentRequest request, String userId){
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));

        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        comment.setContent(request.getContent());
        comment.setModifiedDate(Instant.now());

        comment = commentRepository.save(comment);
        return toCommentResponse(comment);
    }

    public void deleteComment(String commentId){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        deleteCommentWithUserId(commentId, authentication.getName());
    }
    
    /**
     * Delete comment with explicit userId (for Socket.IO)
     */
    public void deleteCommentWithUserId(String commentId, String userId){
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));

        if (!comment.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // Decrement post comment count
        decrementPostCommentCount(comment.getPostId());

        commentRepository.delete(comment);
    }

    public String getCommentPostId(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
        return comment.getPostId();
    }

    public List<CommentResponse> getCommentsByPostId(String postId){
        List<Comment> comments = commentRepository.findAllByPostId(postId);
        return comments.stream()
                .map(this::toCommentResponse)
                .collect(Collectors.toList());
    }

    public void incrementReactionCount(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
        comment.setReactionCount(comment.getReactionCount() != null ? comment.getReactionCount() + 1 : 1);
        commentRepository.save(comment);
    }

    public void decrementReactionCount(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
        comment.setReactionCount(comment.getReactionCount() != null && comment.getReactionCount() > 0
                ? comment.getReactionCount() - 1 : 0);
        commentRepository.save(comment);
    }

    private void incrementPostCommentCount(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));
        post.setCommentCount(post.getCommentCount() != null ? post.getCommentCount() + 1 : 1);
        postRepository.save(post);
    }

    private void decrementPostCommentCount(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));
        post.setCommentCount(post.getCommentCount() != null && post.getCommentCount() > 0
                ? post.getCommentCount() - 1 : 0);
        postRepository.save(post);
    }

    private CommentResponse toCommentResponse(Comment comment) {
        UserProfileResponse userProfile = null;
        try {
            userProfile = profileClient.getProfile(comment.getUserId()).getResult();
        } catch (Exception e) {
            log.error("Error while getting user profile", e);
        }

        return CommentResponse.builder()
                .id(comment.getId())
                .postId(comment.getPostId())
                .userId(comment.getUserId())
                .username(userProfile != null ? userProfile.getUsername() : null)
                .content(comment.getContent())
                .parentCommentId(comment.getParentCommentId())
                .reactionCount(comment.getReactionCount())
                .createdDate(comment.getCreatedDate())
                .modifiedDate(comment.getModifiedDate())
                .build();
    }
}

