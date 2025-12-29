package com.mnp.task.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
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
@Table(name = "task_commits")
public class TaskCommit {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @JsonBackReference
    private Task task;

    @Column(nullable = false)
    String commitHash;      // Git hash (e.g., 8a2b3c)

    @Column(columnDefinition = "TEXT")
    String message;         // Commit message (e.g., "Fix bug #123...")

    String authorName;      // Người commit
    String authorEmail;

    String repositoryUrl;   // Link repo
    String commitUrl;       // Link xem diff code

    LocalDateTime committedAt; // Thời gian commit

    @PrePersist
    protected void onCreate() {
        if (committedAt == null) committedAt = LocalDateTime.now();
    }
}