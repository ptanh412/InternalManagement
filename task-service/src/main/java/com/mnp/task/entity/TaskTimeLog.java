package com.mnp.task.entity;

import com.mnp.task.enums.TimeLogStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_time_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaskTimeLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String taskId;
    String userId;

    LocalDateTime startTime;
    LocalDateTime endTime;
    Integer durationSeconds;

    @Enumerated(EnumType.STRING)
    TimeLogStatus status;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = TimeLogStatus.RUNNING;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}
