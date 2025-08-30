package com.devteria.identity.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.devteria.event.dto.NotificationEvent;
import com.devteria.identity.dto.request.RoleRequest;
import com.devteria.identity.dto.response.RoleResponse;
import com.devteria.identity.entity.User;
import com.devteria.identity.mapper.RoleMapper;
import com.devteria.identity.repository.PermissionRepository;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;
    UserRepository userRepository;
    KafkaTemplate<String, Object> kafkaTemplate;

    public RoleResponse create(RoleRequest request) {
        var role = roleMapper.toRole(request);

        var permissions = permissionRepository.findAllById(request.getPermissions());
        role.setPermissions(new HashSet<>(permissions));

        role = roleRepository.save(role);
        return roleMapper.toRoleResponse(role);
    }

    public List<RoleResponse> getAll() {
        return roleRepository.findAll().stream().map(roleMapper::toRoleResponse).toList();
    }

    // create function to update permissions of a role
    public RoleResponse updatePermissions(String roleName, List<String> permissions) {
        log.info("Role name: {} ", roleName);
        var role = roleRepository.findByIdWithPermissions(roleName).orElseThrow();
        var oldPermissions = role.getPermissions();

        log.info(
                "Old permissions: {}",
                oldPermissions.stream().map(p -> p.getName()).collect(java.util.stream.Collectors.toSet()));
        var permissionEntities = permissionRepository.findAllById(permissions);
        role.setPermissions(new HashSet<>(permissionEntities));
        role = roleRepository.save(role);

        // Find newly added permissions
        var oldPermissionNames =
                oldPermissions.stream().map(p -> p.getName()).collect(java.util.stream.Collectors.toSet());
        var newPermissions = permissionEntities.stream()
                .filter(p -> !oldPermissionNames.contains(p.getName()))
                .toList();

        log.info(
                "New permissions: {}",
                newPermissions.stream().map(p -> p.getName()).collect(java.util.stream.Collectors.toSet()));

        String notificationMessage = "";
        if (!newPermissions.isEmpty()) {
            // Only notify about the first added permission (if multiple, can be adjusted)
            var addedPermission = newPermissions.get(0);
            notificationMessage = "You are allowed " + addedPermission.getDescription();
        } else {
            notificationMessage = "Your permissions have changed.";
        }

        // Add timestamp
        long timestamp = System.currentTimeMillis();

        // Send notification to all users with this role
        List<User> usersWithRole = userRepository.findAllWithRoles().stream()
                .filter(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals(roleName)))
                .toList();
        log.info("Sending notification to {} users with role {}", usersWithRole.size(), roleName);
        for (var user : usersWithRole) {
            NotificationEvent event = NotificationEvent.builder()
                    .channel("WEBSOCKET")
                    .recipient(user.getId())
                    .templateCode("PERMISSION_CHANGE")
                    .param(Map.of(
                            "type", "PERMISSION_CHANGE",
                            "role", roleName,
                            "permissions", permissions,
                            "timestamp", timestamp))
                    .subject("Your permissions have changed")
                    .body(notificationMessage)
                    .contentType("text/plain")
                    .build();
            log.info("Sending notification to user {}: {}", user.getId(), event);
            kafkaTemplate.send("websocket-notification", event);
        }
        return roleMapper.toRoleResponse(role);
    }

    public void delete(String role) {
        roleRepository.deleteById(role);
    }
}
