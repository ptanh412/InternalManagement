package com.mnp.project.repository;

import com.mnp.project.entity.Project;
import com.mnp.project.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    List<Project> findByStatus(ProjectStatus status);

    List<Project> findByProjectLeaderId(String projectLeaderId);

    List<Project> findByTeamLeadId(String teamLeadId);


    @Query("SELECT p FROM Project p WHERE p.createdAt BETWEEN :startDate AND :endDate")
    List<Project> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT p FROM Project p WHERE LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Project> searchProjects(@Param("keyword") String keyword);

    @Query("SELECT COUNT(p) FROM Project p WHERE p.status = :status")
    Long countByStatus(@Param("status") ProjectStatus status);

    @Query("SELECT AVG(p.completionPercentage) FROM Project p")
    Double getAverageCompletionPercentage();

    @Query("SELECT p FROM Project p WHERE p.status IN :statuses")
    List<Project> findByStatusIn(@Param("statuses") List<ProjectStatus> statuses);
}
