package com.mnp.identity.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.mnp.identity.entity.Department;
import com.mnp.identity.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByEmployeeId(String employeeId);

    boolean existsByEmployeeIdAndIdNot(String employeeId, String id);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    Optional<User> findByEmployeeId(String employeeId);

    // Updated to use Department entity instead of departmentId
    List<User> findByDepartment(Department department);

    List<User> findByIsActiveTrue();

    List<User> findByIsActiveFalse();

    @Query("SELECT u FROM User u WHERE u.online = true")
    List<User> findOnlineUsers();

    @Query("SELECT u.employeeId FROM User u WHERE u.employeeId LIKE 'EMP%' ORDER BY u.employeeId DESC")
    List<String> findAllEmployeeIdsOrderedDesc();
}
