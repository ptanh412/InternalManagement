package com.mnp.task.entity;

import com.mnp.task.enums.ExtensionStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tasks_extension")

public class TaskExtension {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String taskId;
    String requestedBy; // Employee who requested
    String reviewedBy; // Team lead who approved/rejected

    Integer extensionHours;
    LocalDateTime newDueDate;

    @Column(columnDefinition = "TEXT", nullable = false)
    String reason;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    ExtensionStatus status = ExtensionStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    String reviewComments;

    LocalDateTime requestedAt;
    LocalDateTime reviewedAt;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        requestedAt = LocalDateTime.now();
        if (status == null) {
            status = ExtensionStatus.PENDING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
