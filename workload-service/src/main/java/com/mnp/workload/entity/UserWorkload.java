package com.mnp.workload.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "user_workloads")
public class UserWorkload {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String userId;

    // Capacity settings
    Integer weeklyCapacityHours = 40;
    Integer dailyCapacityHours = 8;

    // Current workload
    Integer totalEstimateHours = 0;
    Integer totalActualHours = 0;
    Double availabilityPercentage = 100.0;

    LocalDate nextAvailableDate = LocalDate.now();
    Integer upcomingWeekHours = 0;

    LocalDateTime lastUpdated;

    @PrePersist
    private void onCreate() {
        lastUpdated = LocalDateTime.now();
        if (availabilityPercentage == null) {
            availabilityPercentage = 100.0; // Default value
        }
    }

    @PreUpdate
    private void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
