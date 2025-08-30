package com.devteria.identity.entity;

import java.util.Set;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BusinessRole {

    String name;
    String description;
    Set<BusinessPermission> permissions;
}
