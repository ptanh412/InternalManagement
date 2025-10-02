package com.mnp.task.entity;

import com.mnp.task.enums.TaskPriority;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.enums.TaskType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String projectId;

    String parentTaskId;
    String createdBy;
    String assignedTo;
    String reporterId;

    @Column(nullable = false)
    String title;
    @Column(columnDefinition = "TEXT")
    String description;

    @Enumerated(EnumType.STRING)
    TaskType type;

    @Enumerated(EnumType.STRING)
    TaskPriority priority;

    @Enumerated(EnumType.STRING)
    TaskStatus status;

    Integer estimatedHours;
    Integer actualHours;
    LocalDateTime dueDate;
    LocalDateTime startedAt;
    LocalDateTime completedAt;

    Integer qualityRating;
    String qualityComments;

    Double progressPercentage = 0.0;

    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag")
    List<String> tags;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    String comments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = TaskStatus.TODO;
        }
        if (priority == null) {
            priority = TaskPriority.MEDIUM;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
