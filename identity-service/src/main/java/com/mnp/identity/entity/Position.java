package com.mnp.identity.entity;

import java.util.HashMap;
import java.util.Map;

import jakarta.persistence.*;

import com.mnp.identity.enums.SeniorityLevel;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    String title;
    String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    Department department;

    @Enumerated(EnumType.STRING)
    SeniorityLevel seniorityLevel;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "position_required_skills")
    @MapKeyColumn(name = "skill_name")
    @Column(name = "required_level")
    @Builder.Default
    Map<String, Double> requiredSkills = new HashMap<>();
}
