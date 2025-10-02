package com.mnp.workload.repository;

import com.mnp.workload.entity.UserWorkload;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserWorkloadRepository extends JpaRepository<UserWorkload, String> {
    Optional<UserWorkload> findByUserId(String userId);

    @Query("SELECT uw FROM UserWorkload uw WHERE uw.availabilityPercentage > :minAvailability ORDER BY uw.availabilityPercentage DESC")
    List<UserWorkload> findAvailableUsers(@Param("minAvailability") Double minAvailability);

    @Query("SELECT uw FROM UserWorkload uw WHERE uw.userId IN :userIds")
    List<UserWorkload> findByUserIds(@Param("userIds") List<String> userIds);
}
