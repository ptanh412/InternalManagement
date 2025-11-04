package com.mnp.chat.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mnp.chat.dto.response.ReactionSummaryResponse;
import com.mnp.chat.dto.response.UserReactionInfo;
import com.mnp.chat.entity.MessageReaction;
import com.mnp.chat.repository.MessageReactionRepository;
import com.mnp.chat.repository.httpclient.ProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageReactionService {
    MessageReactionRepository messageReactionRepository;
    ProfileClient profileClient;

    @Transactional
    public int addReaction(String messageId, String userId, String icon) {
        var existingReaction = messageReactionRepository
                .findByMessageIdAndUserIdAndIcon(messageId, userId, icon);

        if (existingReaction.isPresent()) {
            // User đã react rồi, không làm gì cả
            log.info("User {} already reacted with {} to message {}",
                    userId, icon, messageId);
            return existingReaction.get().getCount();
        } else {
            // Tìm tất cả reactions với icon này cho message
            var allReactionsWithIcon = messageReactionRepository
                    .findByMessageIdAndIcon(messageId, icon);

            int totalCount = allReactionsWithIcon.size() + 1; // +1 cho user hiện tại

            // Thêm reaction mới cho user này
            MessageReaction reaction = MessageReaction.builder()
                    .messageId(messageId)
                    .userId(userId)
                    .icon(icon)
                    .count(totalCount) // Tổng số users đã react
                    .createdDate(Instant.now())
                    .modifiedDate(Instant.now())
                    .build();
            messageReactionRepository.save(reaction);

            log.info("Added new reaction {} to message {} by user {}",
                    icon, messageId, userId);
            return totalCount;
        }
    }

    @Transactional
    public boolean toggleReaction(String messageId, String userId, String icon) {
        var existingReaction = messageReactionRepository.findByMessageIdAndUserIdAndIcon(messageId, userId, icon);

        if (existingReaction.isPresent()) {
            // Remove existing reaction
            messageReactionRepository.deleteByMessageIdAndUserIdAndIcon(messageId, userId, icon);
            log.info("Removed reaction {} from message {} by user {}", icon, messageId, userId);
            return false; // Reaction removed
        } else {
            // Add new reaction
            MessageReaction reaction = MessageReaction.builder()
                    .messageId(messageId)
                    .userId(userId)
                    .icon(icon)
                    .count(1)
                    .createdDate(Instant.now())
                    .modifiedDate(Instant.now())
                    .build();
            messageReactionRepository.save(reaction);
            log.info("Added reaction {} to message {} by user {}", icon, messageId, userId);
            return true; // Reaction added
        }
    }

    @Transactional
    public int removeReaction(String messageId, String userId, String icon) {
        var existingReaction = messageReactionRepository.findByMessageIdAndUserIdAndIcon(messageId, userId, icon);

        if (existingReaction.isPresent()) {
            // Always completely remove the reaction instead of decrementing
            messageReactionRepository.deleteByMessageIdAndUserIdAndIcon(messageId, userId, icon);
            log.info("Completely removed reaction {} from message {} by user {}", icon, messageId, userId);
            return 0; // Return 0 to indicate complete removal
        } else {
            log.warn(
                    "Attempted to remove non-existent reaction {} from message {} by user {}", icon, messageId, userId);
            return 0;
        }
    }

    public List<ReactionSummaryResponse> getMessageReactionsSummary(String messageId, String currentUserId) {
        List<MessageReaction> reactions = messageReactionRepository.findByMessageId(messageId);

        // Group reactions by icon
        Map<String, List<MessageReaction>> reactionsByIcon =
                reactions.stream().collect(Collectors.groupingBy(MessageReaction::getIcon));

        return reactionsByIcon.entrySet().stream()
                .map(entry -> {
                    String icon = entry.getKey();
                    List<MessageReaction> iconReactions = entry.getValue();

                    // Calculate total count across all users
                    long totalCount = iconReactions.stream()
                            .mapToLong(MessageReaction::getCount)
                            .sum();

                    // Get unique user IDs
                    List<String> userIds = iconReactions.stream()
                            .map(MessageReaction::getUserId)
                            .distinct()
                            .collect(Collectors.toList());

                    // Check if current user reacted and get their count
                    boolean reactedByMe = false;
                    int myReactionCount = 0;

                    // Create user reaction count map and fetch user details
                    Map<String, Integer> userReactionCounts = new HashMap<>();
                    List<UserReactionInfo> users = new ArrayList<>();

                    for (MessageReaction reaction : iconReactions) {
                        userReactionCounts.put(reaction.getUserId(), reaction.getCount());

                        if (reaction.getUserId().equals(currentUserId)) {
                            reactedByMe = true;
                            myReactionCount = reaction.getCount();
                        }

                        // Fetch user profile information
                        try {
                            var userResponse = profileClient.getProfile(reaction.getUserId());
                            if (Objects.nonNull(userResponse) && Objects.nonNull(userResponse.getResult())) {
                                var userProfile = userResponse.getResult();

                                // Check if user is already in the list (to avoid duplicates)
                                boolean userExists = users.stream()
                                        .anyMatch(u -> u.getUserId().equals(reaction.getUserId()));

                                if (!userExists) {
                                    users.add(UserReactionInfo.builder()
                                            .userId(reaction.getUserId())
                                            .username(userProfile.getUser().getUsername())
                                            .firstName(userProfile.getUser().getFirstName())
                                            .lastName(userProfile.getUser().getLastName())
                                            .avatar(userProfile.getAvatar())
                                            .reactionCount(reaction.getCount())
                                            .build());
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Failed to fetch profile for user {}: {}", reaction.getUserId(), e.getMessage());
                            // Add user with minimal info if profile fetch fails
                            boolean userExists =
                                    users.stream().anyMatch(u -> u.getUserId().equals(reaction.getUserId()));

                            if (!userExists) {
                                users.add(UserReactionInfo.builder()
                                        .userId(reaction.getUserId())
                                        .username("Unknown User")
                                        .firstName("")
                                        .lastName("")
                                        .avatar(null)
                                        .reactionCount(reaction.getCount())
                                        .build());
                            }
                        }
                    }

                    return ReactionSummaryResponse.builder()
                            .icon(icon)
                            .count(totalCount)
                            .userIds(userIds)
                            .reactedByMe(reactedByMe)
                            .myReactionCount(myReactionCount)
                            .userReactionCounts(userReactionCounts)
                            .users(users) // Include user details with names and avatars
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<MessageReaction> getMessageReactions(String messageId) {
        return messageReactionRepository.findByMessageId(messageId);
    }

    // New method to get total reaction count for a specific icon
    public int getTotalReactionCount(String messageId, String icon) {
        return messageReactionRepository
                .getTotalCountByMessageIdAndIcon(messageId, icon)
                .orElse(0);
    }

    // Method to reset user's reaction count for a specific icon (optional feature)
    @Transactional
    public boolean removeAllUserReactions(String messageId, String userId, String icon) {
        var existingReaction = messageReactionRepository.findByMessageIdAndUserIdAndIcon(messageId, userId, icon);

        if (existingReaction.isPresent()) {
            messageReactionRepository.deleteByMessageIdAndUserIdAndIcon(messageId, userId, icon);
            log.info("Removed all reactions {} from message {} by user {}", icon, messageId, userId);
            return true;
        }
        return false;
    }
}
