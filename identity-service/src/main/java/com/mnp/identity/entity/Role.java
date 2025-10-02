package com.mnp.identity.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;

import com.mnp.identity.enums.Permission;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id; // Auto-generated UUID primary key

    @Column(unique = true)
    String name; // ADMIN, PROJECT_MANAGER, TEAM_LEAD, EMPLOYEE, AI_SPECIALIST

    String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "role_permissions")
    @Builder.Default
    Set<Permission> permissions = new HashSet<>();
}
