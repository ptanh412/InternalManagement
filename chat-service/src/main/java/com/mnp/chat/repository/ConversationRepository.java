package com.mnp.chat.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import com.mnp.chat.entity.Conversation;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    Optional<Conversation> findByParticipantsHash(String hash);

    @Query("{'participants.userId' : ?0}")
    List<Conversation> findAllByParticipantIdsContains(String userId);

    // Add method to find group conversations by type and group name
    List<Conversation> findByTypeAndGroupNameContaining(String type, String groupName);


    List<Conversation> findAllByParticipantsUserId(String userId);
}
