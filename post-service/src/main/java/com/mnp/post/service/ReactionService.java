package com.mnp.post.service;

import com.mnp.post.dto.request.ReactionRequest;
import com.mnp.post.dto.response.ReactionResponse;
import com.mnp.post.dto.response.UserProfileResponse;
import com.mnp.post.entity.Comment;
import com.mnp.post.entity.Post;
import com.mnp.post.entity.Reaction;
import com.mnp.post.exception.AppException;
import com.mnp.post.exception.ErrorCode;
import com.mnp.post.repository.CommentRepository;
import com.mnp.post.repository.PostRepository;
import com.mnp.post.repository.ReactionRepository;
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
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReactionService {
    ReactionRepository reactionRepository;
    PostRepository postRepository;
    CommentRepository commentRepository;
    ProfileClient profileClient;

    public ReactionResponse toggleReaction(ReactionRequest request){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return toggleReactionWithUserId(request, authentication.getName());
    }
    
    /**
     * Toggle reaction with explicit userId (for Socket.IO)
     */
    public ReactionResponse toggleReactionWithUserId(ReactionRequest request, String userId){
        log.info("Toggling reaction for userId {} on target {} of type {}", userId, request.getTargetId(), request.getReactionType());
        Optional<Reaction> existingReaction = reactionRepository
                .findByUserIdAndTargetIdAndTargetType(userId, request.getTargetId(), request.getTargetType());

        if (existingReaction.isPresent()) {
            // If same reaction type, remove it
            if (existingReaction.get().getReactionType() == request.getReactionType()) {
                reactionRepository.delete(existingReaction.get());

                // Decrement count
                if (request.getTargetType() == Reaction.TargetType.POST) {
                    decrementPostReactionCount(request.getTargetId());
                } else {
                    decrementCommentReactionCount(request.getTargetId());
                }

                return null; // Reaction removed
            } else {
                // Change reaction type
                existingReaction.get().setReactionType(request.getReactionType());
                Reaction updated = reactionRepository.save(existingReaction.get());
                return toReactionResponse(updated);
            }
        } else {
            // Create new reaction
            Reaction reaction = Reaction.builder()
                    .userId(userId)
                    .targetId(request.getTargetId())
                    .reactionType(request.getReactionType())
                    .targetType(request.getTargetType())
                    .createdDate(Instant.now())
                    .build();

            reaction = reactionRepository.save(reaction);

            // Increment count
            if (request.getTargetType() == Reaction.TargetType.POST) {
                incrementPostReactionCount(request.getTargetId());
            } else {
                incrementCommentReactionCount(request.getTargetId());
            }

            ReactionResponse response = toReactionResponse(reaction);
            response.setRequestId(request.getRequestId()); // Set requestId
            return response;
        }
    }

    public List<ReactionResponse> getReactionsByTargetId(String targetId){
        List<Reaction> reactions = reactionRepository.findAllByTargetId(targetId);
        return reactions.stream()
                .map(this::toReactionResponse)
                .collect(Collectors.toList());
    }

    private void incrementPostReactionCount(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));
        post.setReactionCount(post.getReactionCount() != null ? post.getReactionCount() + 1 : 1);
        postRepository.save(post);
    }

    private void decrementPostReactionCount(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));
        post.setReactionCount(post.getReactionCount() != null && post.getReactionCount() > 0
                ? post.getReactionCount() - 1 : 0);
        postRepository.save(post);
    }

    private void incrementCommentReactionCount(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
        comment.setReactionCount(comment.getReactionCount() != null ? comment.getReactionCount() + 1 : 1);
        commentRepository.save(comment);
    }

    private void decrementCommentReactionCount(String commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new AppException(ErrorCode.COMMENT_NOT_EXISTED));
        comment.setReactionCount(comment.getReactionCount() != null && comment.getReactionCount() > 0
                ? comment.getReactionCount() - 1 : 0);
        commentRepository.save(comment);
    }

    private ReactionResponse toReactionResponse(Reaction reaction) {
        UserProfileResponse userProfile = null;
        try {
            userProfile = profileClient.getProfile(reaction.getUserId()).getResult();
        } catch (Exception e) {
            log.error("Error while getting user profile", e);
        }

        return ReactionResponse.builder()
                .id(reaction.getId())
                .userId(reaction.getUserId())
                .username(userProfile != null ? userProfile.getUsername() : null)
                .targetId(reaction.getTargetId())
                .reactionType(reaction.getReactionType())
                .targetType(reaction.getTargetType())
                .createdDate(reaction.getCreatedDate())
                .build();
    }
}

