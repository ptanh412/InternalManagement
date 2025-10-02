package com.mnp.workload.entity;

import com.mnp.workload.enums.TaskPriority;
import com.mnp.workload.enums.TaskStatus;
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
@Table(name = "user_current_tasks")
public class UserCurrentTask {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String userId;
    String taskId;
    String projectId;

    Integer estimatedHours;
    Integer remainingHours;
    Integer actualHoursSpent = 0;
    Double progressPercentage = 0.0;
    String taskTitle;
    LocalDateTime assignedDate;

    LocalDateTime dueDate;
    LocalDateTime startedAt;

    @Enumerated(EnumType.STRING)
    TaskPriority priority;

    @Enumerated(EnumType.STRING)
    TaskStatus status;

    LocalDateTime lastUpdated;



    @PrePersist
    private void onCreate() {
        lastUpdated = LocalDateTime.now();
        if (assignedDate == null) {
            assignedDate = LocalDateTime.now();
        }
    }

    @PreUpdate
    private void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
}
