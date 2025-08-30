package com.devteria.identity.entity;

import java.time.LocalDateTime;
import java.util.Set;

import jakarta.persistence.*;

import com.devteria.identity.enums.BusinessRole;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "username", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String username;

    String password;

    @Column(name = "email", unique = true, columnDefinition = "VARCHAR(255) COLLATE utf8mb4_unicode_ci")
    String email;

    @Column(name = "email_verified", nullable = false, columnDefinition = "boolean default false")
    boolean emailVerified;

    @ManyToMany
    Set<Role> roles;

    // New business attributes
    @ManyToOne
    @JoinColumn(name = "department_id")
    Department department;

    @Enumerated(EnumType.STRING)
    @Column(name = "business_role")
    BusinessRole businessRole;

    String firstName;
    String lastName;
    String employeeId;
    String phoneNumber;

    LocalDateTime joinDate;

    // Online status and last login
    @Column(name = "online", nullable = false, columnDefinition = "boolean default false")
    boolean online = false;

    @Column(name = "last_login")
    LocalDateTime lastLogin;

    @Column(name = "is_active", nullable = false, columnDefinition = "boolean default true")
    boolean isActive = true;
}
