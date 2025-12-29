package com.mnp.task.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
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
@ToString
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

    Integer originalEstimatedHours;

    Integer estimatedHours;
    Integer actualHours;

    // Extension tracking fields
    @Builder.Default
    Integer extensionCount = 0;

    @Builder.Default
    Integer totalExtensionHours = 0;

    LocalDateTime lastExtensionDate;


    // Original due date (never changes after creation)
    LocalDateTime originalDueDate;
    LocalDateTime dueDate;


    LocalDateTime startedAt;
    LocalDateTime completedAt;
    LocalDateTime assignedAt;

    // Flag to track if task had extensions
    @Builder.Default
    Boolean hadExtension = false;

    Integer qualityRating;
    String qualityComments;

    Double progressPercentage = 0.0;

    @ElementCollection
    @CollectionTable(name = "task_tags", joinColumns = @JoinColumn(name = "task_id"))
    @Column(name = "tag")
    List<String> tags;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @Column(columnDefinition = "TEXT") // Cấu hình kiểu TEXT cho MySQL
    String comments;
    // Extra
    Integer storyPoints;
    String buildStatus;
    String branchName;
    String pullRequestUrl;

    // Nếu TaskType = BUG_FIX, dữ liệu chi tiết sẽ nằm ở đây
    @OneToOne(mappedBy = "task", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference // Tránh vòng lặp vô hạn khi serialize JSON
    private TaskBugDetail bugDetail;

    // Danh sách các commit code liên quan đến task này
    @OneToMany(mappedBy = "task", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonManagedReference
    private List<TaskCommit> commits;

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

        // ✅ FIX: Chỉ set originalDueDate NẾU nó NULL
        // Tránh overwrite khi update
        if (dueDate != null && originalDueDate == null) {
            originalDueDate = dueDate;
        }

        if (estimatedHours != null && originalEstimatedHours == null) {
            originalEstimatedHours = estimatedHours;
        }

        // Initialize extension tracking
        if (extensionCount == null) extensionCount = 0;
        if (totalExtensionHours == null) totalExtensionHours = 0;
        if (hadExtension == null) hadExtension = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
