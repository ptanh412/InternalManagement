package com.mnp.task.entity;

import com.mnp.task.enums.SubmissionStatus;
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
@Table(name = "task_submissions")
public class TaskSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String taskId;

    @Column(nullable = false)
    String submittedBy;

    String description;

    // Format: [{"name":"file.pdf","url":"http://...","type":"application/pdf","size":1024}]
    @Column(columnDefinition = "TEXT")
    String attachmentsJson;

    String originalFileName;

    @Enumerated(EnumType.STRING)
    SubmissionStatus status = SubmissionStatus.PENDING;

    String reviewComments;
    String reviewedBy;
    LocalDateTime reviewedAt;

    LocalDateTime submittedAt;

    @PrePersist
    private void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
