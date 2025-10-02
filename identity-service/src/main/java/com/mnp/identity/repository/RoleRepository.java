package com.mnp.identity.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mnp.identity.entity.Role;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {
    Optional<Role> findByName(String name);

    boolean existsByName(String name);

    @Query("SELECT r.id FROM Role r WHERE r.name = :name")
    String findRoleIdByName(@Param("name") String name);

    @Query("SELECT r.name FROM Role r WHERE r.id = :id")
    String findRoleNameById(@Param("id") String id);
}
