package com.mnp.task.entity;

import com.mnp.task.enums.DependencyType;
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
@Table(name = "task_dependencies")
public class TaskDependency {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String taskId; // Dependent task

    @Column(nullable = false)
    String dependsOnTaskId; // Task that must be completed first

    @Enumerated(EnumType.STRING)
    DependencyType type = DependencyType.FINISH_TO_START;

    LocalDateTime createdAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
