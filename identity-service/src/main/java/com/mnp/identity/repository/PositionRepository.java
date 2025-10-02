package com.mnp.identity.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.mnp.identity.entity.Department;
import com.mnp.identity.entity.Position;
import com.mnp.identity.enums.SeniorityLevel;

@Repository
public interface PositionRepository extends JpaRepository<Position, String> {
    List<Position> findByDepartment(Department department);

    List<Position> findBySeniorityLevel(SeniorityLevel seniorityLevel);

    Optional<Position> findBySeniorityLevelAndDepartment(SeniorityLevel seniorityLevel, Department department);

    // Add method to check if position exists by title
    boolean existsByTitle(String title);

    Optional<Position> findByTitle(String title);

    @Query("SELECT p FROM Position p WHERE p.department = :department ORDER BY p.seniorityLevel")
    List<Position> findByDepartmentOrderBySeniorityLevel(@Param("department") Department department);

    @Query("SELECT p FROM Position p WHERE p.department.name LIKE %:departmentName% AND p.seniorityLevel = :level")
    List<Position> findByDepartmentNameAndSeniorityLevel(
            @Param("departmentName") String departmentName, @Param("level") SeniorityLevel level);

    @Query("SELECT p FROM Position p WHERE p.title LIKE %:title%")
    List<Position> findByTitleContaining(@Param("title") String title);
}
