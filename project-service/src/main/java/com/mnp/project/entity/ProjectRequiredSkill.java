package com.mnp.project.entity;

import com.mnp.project.enums.ProficiencyLevel;
import com.mnp.project.enums.SkillType;
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
@Table(name = "project_required_skills")
public class ProjectRequiredSkill {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    String projectId;

    @Column(nullable = false)
    String skillName;

    @Enumerated(EnumType.STRING)
    SkillType skillType;

    @Enumerated(EnumType.STRING)
    ProficiencyLevel requiredLevel;

    @Column(nullable = false)
    boolean isRequired = true;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;

    @PrePersist
    private void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
