package com.mnp.project.entity;

import com.mnp.project.enums.ProjectRole;
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
@Table(name = "project_members")
public class ProjectMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String projectId;

    @Column(nullable = false)
    String userId;

    @Enumerated(EnumType.STRING)
    ProjectRole role = ProjectRole.MEMBER;

    LocalDateTime joinedAt;
    LocalDateTime leftAt;

    @Column(nullable = false)
    boolean isActive = true;

    @PrePersist
    private void onCreate() {
        if (joinedAt == null){
            joinedAt = LocalDateTime.now();
        }
    }
}
