package com.devteria.identity.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.devteria.identity.entity.Department;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, String> {
    boolean existsByName(String name);

    Optional<Department> findByName(String name);
}
