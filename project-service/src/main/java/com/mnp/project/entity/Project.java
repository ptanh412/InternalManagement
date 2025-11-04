package com.mnp.project.entity;

import com.mnp.project.enums.ProjectPriority;
import com.mnp.project.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String name;
    String description;
    @Column(nullable = false)
    String projectLeaderId;

    String teamLeadId; // Separate team lead from project leader

    @Enumerated(EnumType.STRING)
    ProjectStatus status = ProjectStatus.PLANNING;

    @Enumerated(EnumType.STRING)
    ProjectPriority priority = ProjectPriority.MEDIUM;

    BigDecimal budget;
    BigDecimal actualCost = BigDecimal.ZERO;

    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime actualStartDate;
    LocalDateTime actualEndDate;

    Integer totalTasks = 0;
    Integer completedTasks = 0;
    Double completionPercentage = 0.0;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSON")
    Map<String, Object> aiGeneratedTask;

    LocalDateTime createdAt;
    LocalDateTime updatedAt;


    @PrePersist
    private void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    private void onUpdate() {
        updatedAt = LocalDateTime.now();

        if (totalTasks > 0 ){
            completionPercentage = (completedTasks.doubleValue() / totalTasks.doubleValue()) * 100.0;
        }
    }
}
