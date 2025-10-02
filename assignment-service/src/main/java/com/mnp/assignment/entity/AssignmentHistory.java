package com.mnp.assignment.entity;

import com.mnp.assignment.ReassignmentReason;
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
@Table(name = "assignment_history")
public class AssignmentHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String taskId;
    String previousAssignee;
    String newAssignee;
    String reassignedBy;

    @Enumerated(EnumType.STRING)
    ReassignmentReason reason;

    String reasonText; // Added for String-based reason storage

    String comments;
    LocalDateTime reassignedAt;

    @PrePersist
    private void onCreate() {
        reassignedAt = LocalDateTime.now();
    }
}
