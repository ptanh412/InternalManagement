package com.devteria.identity.enums;

public enum BusinessPermission {
    // User Management
    USER_CREATE("USER_CREATE", "Create new users"),
    USER_READ("USER_READ", "View user information"),
    USER_UPDATE("USER_UPDATE", "Update user information"),
    USER_DELETE("USER_DELETE", "Delete users"),
    USER_ACTIVATE_DEACTIVATE("USER_ACTIVATE_DEACTIVATE", "Activate/Deactivate users"),

    // Department Management
    DEPARTMENT_CREATE("DEPARTMENT_CREATE", "Create new departments"),
    DEPARTMENT_READ("DEPARTMENT_READ", "View department information"),
    DEPARTMENT_UPDATE("DEPARTMENT_UPDATE", "Update department information"),
    DEPARTMENT_DELETE("DEPARTMENT_DELETE", "Delete departments"),

    // Role & Permission Management
    ROLE_CREATE("ROLE_CREATE", "Create new roles"),
    ROLE_READ("ROLE_READ", "View roles"),
    ROLE_UPDATE("ROLE_UPDATE", "Update roles"),
    ROLE_DELETE("ROLE_DELETE", "Delete roles"),
    PERMISSION_ASSIGN("PERMISSION_ASSIGN", "Assign permissions to roles"),

    // Project Management
    PROJECT_CREATE("PROJECT_CREATE", "Create new projects"),
    PROJECT_READ("PROJECT_READ", "View projects"),
    PROJECT_UPDATE("PROJECT_UPDATE", "Update projects"),
    PROJECT_DELETE("PROJECT_DELETE", "Delete projects"),
    PROJECT_ASSIGN_MEMBERS("PROJECT_ASSIGN_MEMBERS", "Assign members to projects"),

    // Reports and Analytics
    REPORTS_VIEW("REPORTS_VIEW", "View business reports"),
    ANALYTICS_VIEW("ANALYTICS_VIEW", "View analytics dashboard"),

    // Administrative Functions
    SYSTEM_CONFIG("SYSTEM_CONFIG", "Configure system settings"),
    AUDIT_LOGS("AUDIT_LOGS", "Access audit logs"),
    BACKUP_RESTORE("BACKUP_RESTORE", "Perform backup and restore operations"),

    // Document Management
    DOCUMENT_CREATE("DOCUMENT_CREATE", "Create documents"),
    DOCUMENT_READ("DOCUMENT_READ", "Read documents"),
    DOCUMENT_UPDATE("DOCUMENT_UPDATE", "Update documents"),
    DOCUMENT_DELETE("DOCUMENT_DELETE", "Delete documents"),
    DOCUMENT_APPROVE("DOCUMENT_APPROVE", "Approve documents"),

    // Communication
    ANNOUNCEMENT_CREATE("ANNOUNCEMENT_CREATE", "Create company announcements"),
    ANNOUNCEMENT_SEND("ANNOUNCEMENT_SEND", "Send announcements"),

    // HR Functions
    EMPLOYEE_EVALUATION("EMPLOYEE_EVALUATION", "Conduct employee evaluations"),
    LEAVE_APPROVE("LEAVE_APPROVE", "Approve leave requests"),
    PAYROLL_VIEW("PAYROLL_VIEW", "View payroll information");

    private final String name;
    private final String description;

    BusinessPermission(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
