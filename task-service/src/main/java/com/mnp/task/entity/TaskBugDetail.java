package com.mnp.task.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.mnp.task.enums.BugSeverity;
import com.mnp.task.enums.Environment;
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
@Table(name = "task_bug_details")
public class TaskBugDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    // Liên kết ngược lại Task
    @OneToOne
    @JoinColumn(name = "task_id", nullable = false)
    @JsonBackReference
    private Task task;

    @Enumerated(EnumType.STRING)
    BugSeverity severity; // Mức độ nghiêm trọng

    @Enumerated(EnumType.STRING)
    Environment environment; // Môi trường xảy ra lỗi (PROD, DEV...)

    @Column(columnDefinition = "TEXT")
    String reproduceSteps; // Các bước tái hiện lỗi

    String affectedVersion; // Phiên bản bị lỗi (v1.0.1)
    String fixedVersion;    // Phiên bản đã fix (v1.0.2)

    String browser;         // Chrome, Safari... (Optional)
    String device;          // iPhone 14, Desktop... (Optional)

    LocalDateTime identifiedAt; // Thời điểm phát hiện lỗi

    @PrePersist
    protected void onCreate() {
        if (identifiedAt == null) identifiedAt = LocalDateTime.now();
    }
}