package com.mnp.project.repository;

import com.mnp.project.entity.ProjectMember;
import com.mnp.project.enums.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, String> {

    List<ProjectMember> findByProjectIdAndIsActive(String projectId, boolean isActive);

    List<ProjectMember> findByUserIdAndIsActive(String userId, boolean isActive);

    Optional<ProjectMember> findByProjectIdAndUserIdAndIsActive(String projectId, String userId, boolean isActive);

    List<ProjectMember> findByProjectIdAndRoleAndIsActive(String projectId, ProjectRole role, boolean isActive);

    @Query("SELECT COUNT(pm) FROM ProjectMember pm WHERE pm.projectId = :projectId AND pm.isActive = true")
    Long countActiveMembers(@Param("projectId") String projectId);

    @Query("SELECT pm FROM ProjectMember pm WHERE pm.projectId = :projectId AND pm.role = :role AND pm.isActive = true")
    List<ProjectMember> findActiveProjectMembersByRole(@Param("projectId") String projectId, @Param("role") ProjectRole role);

    boolean existsByProjectIdAndUserIdAndIsActive(String projectId, String userId, boolean isActive);
}
