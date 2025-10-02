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
        calculateAvailability();
    }

    @PreUpdate
    private void onUpdate() {
        lastUpdated = LocalDateTime.now();
        calculateAvailability();
    }

    private void calculateAvailability() {
        if (weeklyCapacityHours > 0) {
            availabilityPercentage = Math.max(0.0,
                    100.0 - ((double) totalEstimateHours / weeklyCapacityHours * 100.0));
        }
    }
}
