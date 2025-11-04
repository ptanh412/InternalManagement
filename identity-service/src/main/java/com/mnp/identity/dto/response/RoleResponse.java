package com.mnp.identity.dto.response;

import java.time.LocalDateTime;
import java.util.Set;

import com.mnp.identity.enums.Permission;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleResponse {
    String id;
    String name;
    String description;
    Set<Permission> permissions;
    boolean active;
    LocalDateTime createdAt;
}
