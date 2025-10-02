package com.mnp.identity.enums;

public enum Permission {
    MANAGE_USERS("Manage users and user accounts"),
    MANAGE_SYSTEM_SETTINGS("Manage system-wide settings and configurations"),
    VIEW_ALL_REPORTS("View all system reports and analytics"),
    CREATE_PROJECTS("Create and initialize new projects"),
    ASSIGN_TASKS("Assign tasks to team members"),
    VIEW_PROJECTS("View project details and progress"),
    EDIT_PROJECTS("Edit project information and settings"),
    DELETE_PROJECTS("Delete projects from the system"),
    MANAGE_DEPARTMENTS("Manage department structure and assignments"),
    MANAGE_POSITIONS("Manage position definitions and requirements"),
    VIEW_USER_PROFILES("View user profiles and information"),
    EDIT_USER_PROFILES("Edit user profile information"),
    MANAGE_ROLES("Manage roles and role permissions"),
    VIEW_ANALYTICS("View system analytics and metrics"),
    EXPORT_DATA("Export system data and reports");

    private final String description;

    Permission(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
