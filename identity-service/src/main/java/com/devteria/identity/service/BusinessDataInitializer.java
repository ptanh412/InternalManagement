// package com.devteria.identity.service;
//
// import java.util.HashSet;
// import java.util.Set;
//
// import org.springframework.boot.ApplicationArguments;
// import org.springframework.boot.ApplicationRunner;
// import org.springframework.stereotype.Component;
//
// import com.devteria.identity.configuration.BusinessRolePermissionConfig;
// import com.devteria.identity.entity.Permission;
// import com.devteria.identity.entity.Role;
// import com.devteria.identity.enums.BusinessPermission;
// import com.devteria.identity.enums.BusinessRole;
// import com.devteria.identity.repository.PermissionRepository;
// import com.devteria.identity.repository.RoleRepository;
//
// import lombok.AccessLevel;
// import lombok.RequiredArgsConstructor;
// import lombok.experimental.FieldDefaults;
// import lombok.extern.slf4j.Slf4j;
//
// @Component
// @RequiredArgsConstructor
// @FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
// @Slf4j
// public class BusinessDataInitializer implements ApplicationRunner {
//
//    PermissionRepository permissionRepository;
//    RoleRepository roleRepository;
//    BusinessRolePermissionConfig businessRolePermissionConfig;
//
//    @Override
//    public void run(ApplicationArguments args) throws Exception {
//        log.info("Initializing business data...");
//
//        initializeBusinessPermissions();
//        initializeBusinessRoles();
//
//        log.info("Business data initialization completed");
//    }
//
//    private void initializeBusinessPermissions() {
//        log.info("Initializing business permissions...");
//
//        for (BusinessPermission businessPermission : BusinessPermission.values()) {
//            if (!permissionRepository.existsById(businessPermission.getName())) {
//                Permission permission = Permission.builder()
//                        .name(businessPermission.getName())
//                        .description(businessPermission.getDescription())
//                        .build();
//
//                permissionRepository.save(permission);
//                log.info("Created permission: {}", businessPermission.getName());
//            }
//        }
//    }
//
//    private void initializeBusinessRoles() {
//        log.info("Initializing business roles...");
//
//        for (BusinessRole businessRole : BusinessRole.values()) {
//            String roleName = businessRole.name();
//
//            if (!roleRepository.existsById(roleName)) {
//                // Get permissions for this business role
//                Set<String> permissionNames =
// businessRolePermissionConfig.getPermissionsForBusinessRole(businessRole);
//                Set<Permission> permissions = new HashSet<>();
//
//                for (String permissionName : permissionNames) {
//                    permissionRepository.findById(permissionName).ifPresent(permissions::add);
//                }
//
//                Role role = Role.builder()
//                        .name(roleName)
//                        .description(businessRole.getDescription())
//                        .permissions(permissions)
//                        .build();
//
//                roleRepository.save(role);
//                log.info("Created business role: {} with {} permissions", roleName, permissions.size());
//            }
//        }
//    }
// }
