package com.mnp.chat.repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.mongodb.repository.Aggregation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.mnp.chat.entity.MessageReaction;

@Repository
public interface MessageReactionRepository extends MongoRepository<MessageReaction, String> {
    List<MessageReaction> findByMessageId(String messageId);

    Optional<MessageReaction> findByMessageIdAndUserIdAndIcon(String messageId, String userId, String icon);

    void deleteByMessageIdAndUserIdAndIcon(String messageId, String userId, String icon);


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
}
