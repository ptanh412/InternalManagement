package com.devteria.identity.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.User;
import com.devteria.identity.enums.BusinessRole;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);

    Optional<User> findByUsername(String username);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.roles")
    List<User> findAllWithRoles();

    // Business management queries
    @Query("SELECT u FROM User u WHERE u.department.id = :departmentId AND u.isActive = true")
    List<User> findByDepartmentId(@Param("departmentId") String departmentId);

    @Query(
            "SELECT u FROM User u WHERE u.department.id = :departmentId AND u.businessRole = :businessRole AND u.isActive = true")
    List<User> findByDepartmentIdAndBusinessRole(
            @Param("departmentId") String departmentId, @Param("businessRole") BusinessRole businessRole);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.department LEFT JOIN FETCH u.roles WHERE u.isActive = true ORDER BY "
            + "CASE u.businessRole "
            + "WHEN 'DIRECTOR' THEN 1 "
            + "WHEN 'SECRETARY' THEN 2 "
            + "WHEN 'HEADER_DEPARTMENT' THEN 3 "
            + "WHEN 'DEPUTY_DEPARTMENT' THEN 4 "
            + "WHEN 'LEADER_PROJECT' THEN 5 "
            + "WHEN 'DEPUTY_PROJECT' THEN 6 "
            + "WHEN 'ADMINISTRATION' THEN 7 "
            + "WHEN 'MEMBER' THEN 8 "
            + "ELSE 9 END")
    List<User> findAllOrderByBusinessRoleHierarchy();

    @Query("SELECT u FROM User u WHERE u.isActive = true")
    List<User> findAllActiveUsers();
}
