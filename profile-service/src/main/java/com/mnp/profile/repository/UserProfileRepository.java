package com.mnp.profile.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.stereotype.Repository;

import com.mnp.profile.entity.UserProfile;

@Repository
public interface UserProfileRepository extends Neo4jRepository<UserProfile, String> {
    @Query(
            "MATCH (up:user_profile) WHERE up.userId = $userId OPTIONAL MATCH (up)-[r:HAS_SKILL]->(us:user_skill) RETURN up, r, us ORDER BY up.updatedAt DESC LIMIT 1")
    Optional<UserProfile> findLatestByUserId(String userId);

    @Query(
            "MATCH (up:user_profile) WHERE up.userId = $userId OPTIONAL MATCH (up)-[r:HAS_SKILL]->(us:user_skill) RETURN up, r, us")
    List<UserProfile> findAllByUserId(String userId);

    // Override default methods to ensure skills are loaded
    @Override
    @Query("MATCH (up:user_profile) OPTIONAL MATCH (up)-[r:HAS_SKILL]->(us:user_skill) RETURN up, r, us")
    List<UserProfile> findAll();

    @Override
    @Query(
            "MATCH (up:user_profile) WHERE up.id = $id OPTIONAL MATCH (up)-[r:HAS_SKILL]->(us:user_skill) RETURN up, r, us")
    Optional<UserProfile> findById(String id);
}
