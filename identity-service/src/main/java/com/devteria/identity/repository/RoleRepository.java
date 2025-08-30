package com.devteria.identity.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.Role;

import feign.Param;

@Repository
public interface RoleRepository extends JpaRepository<Role, String> {

    @Query("SELECT r FROM Role r LEFT JOIN FETCH r.permissions WHERE r.name = :name")
    Optional<Role> findByIdWithPermissions(@Param("name") String name);
}
