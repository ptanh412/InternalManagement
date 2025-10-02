package com.mnp.project.entity;

import com.mnp.project.enums.MilestoneStatus;
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
@Table(name = "project_milestones")
public class ProjectMilestone {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String projectId;
    String name;

    String description;

    LocalDateTime dueDate;
    LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    MilestoneStatus status = MilestoneStatus.PENDING;

    @Column(nullable = false, columnDefinition = "boolean default false")
    boolean isCompleted = false;

    LocalDateTime createdAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
