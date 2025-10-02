package com.mnp.assignment.entity;

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
@Table(name = "task_assignments")
public class TaskAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String taskId;

    String candidateUserId;

    Double assigmentScore;
    Double skillMatchScore;
    Double workLoadScore;
    Double performanceScore;
    Double availabilityScore;

    Boolean isSelected = false;

    String assignmentReason;

    List<String> candidateUsers; // List các user được suggest


    LocalDateTime createdAt;
    LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
