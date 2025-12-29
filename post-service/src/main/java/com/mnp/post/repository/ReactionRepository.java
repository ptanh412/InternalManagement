package com.mnp.post.repository;

import com.mnp.post.entity.Reaction;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends MongoRepository<Reaction, String> {
    List<Reaction> findAllByTargetId(String targetId);
    Optional<Reaction> findByUserIdAndTargetIdAndTargetType(String userId, String targetId, Reaction.TargetType targetType);
}

