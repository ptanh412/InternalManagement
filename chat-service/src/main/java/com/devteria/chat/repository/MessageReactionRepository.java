package com.devteria.chat.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.devteria.chat.entity.MessageReaction;

@Repository
public interface MessageReactionRepository extends MongoRepository<MessageReaction, String> {
    List<MessageReaction> findByMessageId(String messageId);

    Optional<MessageReaction> findByMessageIdAndUserIdAndIcon(String messageId, String userId, String icon);

    void deleteByMessageIdAndUserIdAndIcon(String messageId, String userId, String icon);

    long countByMessageIdAndIcon(String messageId, String icon);

    // New methods for enhanced reaction counting
    @Query("{ 'messageId': ?0, 'icon': ?1 }")
    List<MessageReaction> findByMessageIdAndIcon(String messageId, String icon);

    // Calculate total count for an icon across all users
    @Aggregation(
            pipeline = {
                "{ $match: { 'messageId': ?0, 'icon': ?1 } }",
                "{ $group: { '_id': null, 'totalCount': { $sum: '$count' } } }"
            })
    Optional<Integer> getTotalCountByMessageIdAndIcon(String messageId, String icon);

    // Get all reactions with counts for a message
    @Aggregation(
            pipeline = {
                "{ $match: { 'messageId': ?0 } }",
                "{ $group: { '_id': '$icon', 'totalCount': { $sum: '$count' }, 'users': { $push: { 'userId': '$userId', 'count': '$count' } } } }"
            })
    List<Map<String, Object>> getReactionSummaryByMessageId(String messageId);
}
