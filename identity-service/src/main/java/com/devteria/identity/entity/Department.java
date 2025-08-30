package com.devteria.identity.entity;

import java.util.Set;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
public class Department {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(unique = true, nullable = false)
    String name;

    @OneToMany(mappedBy = "department", fetch = FetchType.LAZY)
    Set<User> users;

    @OneToOne
    @JoinColumn(name = "header_id")
    User header;

    @OneToOne
    @JoinColumn(name = "deputy_id")
    User deputy;
}
