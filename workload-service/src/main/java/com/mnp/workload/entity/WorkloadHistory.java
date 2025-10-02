package com.mnp.workload.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Table(name = "workload_history")
public class WorkloadHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String userId;
    LocalDate recordDate;

    Integer dailyCapacityHours;
    Integer actualHoursWorked;
    Integer tasksCompleted;
    Double utilizationRate; // actualHours / capacityHours * 100

    LocalDateTime createdAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
        if (dailyCapacityHours > 0) {
            utilizationRate = (actualHoursWorked.doubleValue() / dailyCapacityHours.doubleValue()) * 100.0;
        }
    }
}
