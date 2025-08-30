package com.devteria.identity.configuration;

import java.util.*;

import org.springframework.context.annotation.Configuration;

import com.devteria.identity.enums.BusinessRole;

import lombok.Getter;

@Configuration
@Getter
public class BusinessRolePermissionConfig {

    private final Map<String, Set<String>> rolePermissions;

    public BusinessRolePermissionConfig() {
        rolePermissions = new HashMap<>();
        initializeRolePermissions();
    }

    private void initializeRolePermissions() {
        // DIRECTOR role permissions - highest level access
        rolePermissions.put(
                "DIRECTOR",
                Set.of(
                        "CREATE_USER",
                        "READ_USER",
                        "UPDATE_USER",
                        "DELETE_USER",
                        "CREATE_ROLE",
                        "READ_ROLE",
                        "UPDATE_ROLE",
                        "DELETE_ROLE",
                        "CREATE_DEPARTMENT",
                        "READ_DEPARTMENT",
                        "UPDATE_DEPARTMENT",
                        "DELETE_DEPARTMENT",
                        "MANAGE_PERMISSIONS",
                        "VIEW_ANALYTICS",
                        "SYSTEM_CONFIG",
                        "APPROVE_BUDGET",
                        "STRATEGIC_PLANNING",
                        "COMPANY_POLICY"));

        // SECRETARY role permissions - executive support
        rolePermissions.put(
                "SECRETARY",
                Set.of(
                        "READ_USER", "UPDATE_USER",
                        "READ_DEPARTMENT", "UPDATE_DEPARTMENT",
                        "VIEW_ANALYTICS", "SCHEDULE_MANAGEMENT",
                        "DOCUMENT_MANAGEMENT", "MEETING_COORDINATION"));

        // HEADER_DEPARTMENT role permissions - department head
        rolePermissions.put(
                "HEADER_DEPARTMENT",
                Set.of(
                        "CREATE_USER",
                        "READ_USER",
                        "UPDATE_USER",
                        "READ_ROLE",
                        "UPDATE_ROLE",
                        "READ_DEPARTMENT",
                        "UPDATE_DEPARTMENT",
                        "MANAGE_TEAM",
                        "VIEW_ANALYTICS",
                        "DEPARTMENT_BUDGET"));

        // DEPUTY_DEPARTMENT role permissions - deputy department head
        rolePermissions.put(
                "DEPUTY_DEPARTMENT",
                Set.of(
                        "READ_USER",
                        "UPDATE_USER",
                        "READ_ROLE",
                        "READ_DEPARTMENT",
                        "UPDATE_DEPARTMENT",
                        "MANAGE_TEAM",
                        "VIEW_ANALYTICS"));

        // LEADER_PROJECT role permissions - project leader
        rolePermissions.put(
                "LEADER_PROJECT",
                Set.of(
                        "READ_USER",
                        "UPDATE_USER",
                        "READ_DEPARTMENT",
                        "MANAGE_TEAM",
                        "PROJECT_MANAGEMENT",
                        "TASK_ASSIGNMENT",
                        "PROGRESS_TRACKING"));

        // DEPUTY_PROJECT role permissions - deputy project leader
        rolePermissions.put(
                "DEPUTY_PROJECT",
                Set.of(
                        "READ_USER",
                        "UPDATE_USER",
                        "READ_DEPARTMENT",
                        "MANAGE_TEAM",
                        "PROJECT_SUPPORT",
                        "TASK_ASSIGNMENT"));

        // ADMINISTRATION role permissions - administrative staff
        rolePermissions.put(
                "ADMINISTRATION",
                Set.of(
                        "READ_USER", "UPDATE_USER",
                        "READ_ROLE", "UPDATE_ROLE",
                        "READ_DEPARTMENT", "UPDATE_DEPARTMENT",
                        "VIEW_ANALYTICS", "ADMINISTRATIVE_TASKS"));

        // MEMBER role permissions - regular member
        rolePermissions.put(
                "MEMBER",
                Set.of(
                        "READ_USER", "UPDATE_PROFILE",
                        "READ_DEPARTMENT", "VIEW_TASKS"));
    }

    public Set<String> getPermissionsForRole(String roleName) {
        return rolePermissions.getOrDefault(roleName, Set.of());
    }

    public Set<String> getPermissionsForBusinessRole(BusinessRole businessRole) {
        return rolePermissions.getOrDefault(businessRole.name(), Set.of());
    }
}
