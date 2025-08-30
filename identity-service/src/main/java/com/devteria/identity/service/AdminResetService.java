package com.devteria.identity.service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import jakarta.transaction.Transactional;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.devteria.identity.configuration.BusinessRolePermissionConfig;
import com.devteria.identity.constant.PredefinedRole;
import com.devteria.identity.entity.Department;
import com.devteria.identity.entity.Permission;
import com.devteria.identity.entity.Role;
import com.devteria.identity.entity.User;
import com.devteria.identity.enums.BusinessPermission;
import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.repository.DepartmentRepository;
import com.devteria.identity.repository.PermissionRepository;
import com.devteria.identity.repository.RoleRepository;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@Profile("admin-reset")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AdminResetService implements CommandLineRunner {

    UserRepository userRepository;
    RoleRepository roleRepository;
    DepartmentRepository departmentRepository;
    PermissionRepository permissionRepository;
    BusinessRolePermissionConfig businessRolePermissionConfig;
    PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        log.info("Starting Admin Reset Process...");

        // 1. Delete existing admin users
        deleteExistingAdminUsers();

        // 2. Create all business permissions and roles
        createBusinessPermissionsAndRoles();

        // 3. Create complete company department structure
        Department headquartersDept = createCompanyDepartments();

        // 4. Create new admin user with full attributes
        createAdminUser(headquartersDept);

        log.info("Admin reset process completed successfully!");
        logAdminCredentials();
        logDepartmentStructure();
        logBusinessRolesAndPermissions();
    }

    @Transactional
    public void deleteExistingAdminUsers() {
        log.info("Deleting existing admin users...");

        // Find and delete users with admin role or username 'admin'
        userRepository.findByUsername("admin").ifPresent(user -> {
            log.info("Deleting existing admin user: {}", user.getUsername());
            userRepository.delete(user);
        });

        // Delete any other users with ADMIN role
        roleRepository.findById(PredefinedRole.ADMIN_ROLE).ifPresent(adminRole -> {
            userRepository.findAllWithRoles().stream()
                    .filter(user -> user.getRoles().contains(adminRole))
                    .forEach(user -> {
                        log.info("Deleting admin user: {}", user.getUsername());
                        userRepository.delete(user);
                    });
        });

        log.info("Existing admin users deleted.");
    }

    private void createBusinessPermissionsAndRoles() {
        log.info("Creating comprehensive business permissions and roles...");

        // 1. Create all business permissions from enum
        initializeBusinessPermissions();

        // 2. Create business roles with appropriate permissions
        initializeBusinessRoles();

        log.info("Business permissions and roles creation completed");
    }

    private void initializeBusinessPermissions() {
        log.info("Initializing business permissions...");

        for (BusinessPermission businessPermission : BusinessPermission.values()) {
            if (!permissionRepository.existsById(businessPermission.getName())) {
                Permission permission = Permission.builder()
                        .name(businessPermission.getName())
                        .description(businessPermission.getDescription())
                        .build();

                permissionRepository.save(permission);
                log.info("Created permission: {}", businessPermission.getName());
            } else {
                log.info("Permission already exists: {}", businessPermission.getName());
            }
        }
    }

    private void initializeBusinessRoles() {
        log.info("Initializing business roles with permissions...");

        for (BusinessRole businessRole : BusinessRole.values()) {
            String roleName = businessRole.name();

            if (!roleRepository.existsById(roleName)) {
                // Get permissions for this business role
                Set<String> permissionNames = businessRolePermissionConfig.getPermissionsForBusinessRole(businessRole);
                Set<Permission> permissions = new HashSet<>();

                for (String permissionName : permissionNames) {
                    permissionRepository.findById(permissionName).ifPresent(permissions::add);
                }

                Role role = Role.builder()
                        .name(roleName)
                        .description(businessRole.getDescription())
                        .permissions(permissions)
                        .build();

                roleRepository.save(role);
                log.info("Created business role: {} with {} permissions", roleName, permissions.size());
            } else {
                log.info("Business role already exists: {}", roleName);
            }
        }

        // Also create standard system roles if they don't exist
        createStandardRoles();
    }

    private void createStandardRoles() {
        // Create ADMIN role if it doesn't exist
        if (!roleRepository.existsById(PredefinedRole.ADMIN_ROLE)) {
            Set<Permission> allPermissions = new HashSet<>();
            for (BusinessPermission businessPermission : BusinessPermission.values()) {
                permissionRepository.findById(businessPermission.getName()).ifPresent(allPermissions::add);
            }

            Role adminRole = Role.builder()
                    .name(PredefinedRole.ADMIN_ROLE)
                    .description("System Administrator with all permissions")
                    .permissions(allPermissions)
                    .build();

            roleRepository.save(adminRole);
            log.info("Created ADMIN role with all {} permissions", allPermissions.size());
        }

        // Create USER role if it doesn't exist
        if (!roleRepository.existsById(PredefinedRole.USER_ROLE)) {
            Set<Permission> userPermissions = new HashSet<>();
            // Give basic permissions to regular users
            String[] basicPermissions = {
                BusinessPermission.USER_READ.getName(),
                BusinessPermission.DEPARTMENT_READ.getName(),
                BusinessPermission.PROJECT_READ.getName(),
                BusinessPermission.DOCUMENT_READ.getName()
            };

            for (String permName : basicPermissions) {
                permissionRepository.findById(permName).ifPresent(userPermissions::add);
            }

            Role userRole = Role.builder()
                    .name(PredefinedRole.USER_ROLE)
                    .description("Standard user with basic permissions")
                    .permissions(userPermissions)
                    .build();

            roleRepository.save(userRole);
            log.info("Created USER role with {} permissions", userPermissions.size());
        }
    }

    private Department createCompanyDepartments() {
        log.info("Creating complete company department structure...");

        // Create or get headquarters (root department)
        Department headquarters = departmentRepository
                .findByName("Headquarters")
                .orElseGet(() -> {
                    Department hq = Department.builder().name("Headquarters").build();
                    return departmentRepository.save(hq);
                });

        // Define all company departments
        String[][] departmentData = {
            // {Name, Description}
            {"Information Technology", "IT infrastructure, software development, and technical support"},
            {"Human Resources", "Employee relations, recruitment, and organizational development"},
            {"Finance", "Financial planning, accounting, and budget management"},
            {"Marketing", "Brand management, advertising, and market research"},
            {"Sales", "Customer acquisition, account management, and revenue generation"},
            {"Operations", "Business operations, process improvement, and logistics"},
            {"Legal", "Legal compliance, contracts, and risk management"},
            {"Research & Development", "Product innovation, research, and development projects"},
            {"Customer Service", "Customer support, help desk, and client relations"},
            {"Quality Assurance", "Quality control, testing, and compliance monitoring"},
            {"Procurement", "Vendor management, purchasing, and supply chain"},
            {"Training & Development", "Employee training, skill development, and education programs"},
            {"Security", "Physical security, information security, and safety protocols"},
            {"Facilities Management", "Building maintenance, utilities, and workplace services"},
            {"Business Development", "Strategic partnerships, new ventures, and growth initiatives"}
        };

        log.info("Creating {} standard company departments...", departmentData.length);

        for (String[] deptInfo : departmentData) {
            String name = deptInfo[0];
            String description = deptInfo[1];

            if (!departmentRepository.existsByName(name)) {
                Department dept = Department.builder().name(name).build();

                Department savedDept = departmentRepository.save(dept);
                log.info("Created department: {} (ID: {})", name, savedDept.getId());
            } else {
                log.info("Department already exists: {}", name);
            }
        }

        // Create some specialized sub-departments
        createSubDepartments(headquarters);

        log.info("Company department structure creation completed");
        return headquarters;
    }

    private void createSubDepartments(Department headquarters) {
        log.info("Creating specialized sub-departments...");

        // IT Sub-departments
        Department itDept =
                departmentRepository.findByName("Information Technology").orElse(null);
        if (itDept != null) {
            createSubDepartment("Software Development", "Application development and programming", itDept);
            createSubDepartment("Network Administration", "Network infrastructure and system administration", itDept);
            createSubDepartment("Help Desk", "Technical support and user assistance", itDept);
            createSubDepartment("Cybersecurity", "Information security and threat prevention", itDept);
        }

        // Finance Sub-departments
        Department financeDept = departmentRepository.findByName("Finance").orElse(null);
        if (financeDept != null) {
            createSubDepartment("Accounting", "Financial recording and bookkeeping", financeDept);
            createSubDepartment("Treasury", "Cash management and financial planning", financeDept);
            createSubDepartment("Internal Audit", "Financial auditing and compliance", financeDept);
        }

        // Marketing Sub-departments
        Department marketingDept = departmentRepository.findByName("Marketing").orElse(null);
        if (marketingDept != null) {
            createSubDepartment("Digital Marketing", "Online marketing and social media", marketingDept);
            createSubDepartment("Content Creation", "Marketing materials and brand content", marketingDept);
            createSubDepartment("Market Research", "Market analysis and customer insights", marketingDept);
        }

        // HR Sub-departments
        Department hrDept = departmentRepository.findByName("Human Resources").orElse(null);
        if (hrDept != null) {
            createSubDepartment("Recruitment", "Talent acquisition and hiring", hrDept);
            createSubDepartment("Employee Relations", "Workplace relations and conflict resolution", hrDept);
            createSubDepartment("Payroll", "Compensation and benefits administration", hrDept);
        }
    }

    private void createSubDepartment(String name, String description, Department parent) {
        if (!departmentRepository.existsByName(name)) {
            Department subDept = Department.builder().name(name).build();

            Department saved = departmentRepository.save(subDept);
            log.info("Created sub-department: {} under {} (ID: {})", name, parent.getName(), saved.getId());
        }
    }

    private void createAdminUser(Department headquartersDept) {
        log.info("Creating new admin user with full business attributes...");

        // Get admin role
        Role adminRole = roleRepository
                .findById(PredefinedRole.ADMIN_ROLE)
                .orElseThrow(() -> new RuntimeException("ADMIN role not found"));

        // Get business director role if exists
        Set<Role> roles = new HashSet<>();
        roles.add(adminRole);
        roleRepository.findById("BUSINESS_DIRECTOR").ifPresent(roles::add);

        // Create admin user with full attributes
        User adminUser = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("Admin@123456"))
                .email("admin@bookteria.com")
                .emailVerified(true)
                .firstName("System")
                .lastName("Administrator")
                .employeeId("EMP-ADMIN-001")
                .phoneNumber("+1-555-0100")
                .joinDate(LocalDateTime.now())
                .isActive(true)
                .roles(roles)
                // Business attributes
                .department(headquartersDept)
                .businessRole(BusinessRole.DIRECTOR)
                .build();

        User savedUser = userRepository.save(adminUser);
        log.info(
                "Created admin user with ID: {} and business role: {}", savedUser.getId(), savedUser.getBusinessRole());
    }

    private void logAdminCredentials() {
        log.info("=".repeat(60));
        log.info("ADMIN ACCOUNT RESET COMPLETED");
        log.info("=".repeat(60));
        log.info("New Admin Credentials:");
        log.info("Username: admin");
        log.info("Email: admin@bookteria.com");
        log.info("Password: Admin@123456");
        log.info("Employee ID: EMP-ADMIN-001");
        log.info("Business Role: DIRECTOR (highest authority)");
        log.info("Department: Headquarters");
        log.info("Phone: +1-555-0100");
        log.info("Status: Active, Email Verified");
        log.info("=".repeat(60));
        log.info("The admin account has full business management permissions");
        log.info("and can manage all departments, users, and business operations.");
        log.info("=".repeat(60));
    }

    private void logDepartmentStructure() {
        log.info("=".repeat(60));
        log.info("COMPANY DEPARTMENT STRUCTURE CREATED");
        log.info("=".repeat(60));

        // Count departments by level
        long totalDepartments = departmentRepository.count();

        log.info("Total Departments Created: {}", totalDepartments);

        log.info("");
        log.info("Main Departments:");
        log.info("• Headquarters (Executive Leadership)");
        log.info("• Information Technology (IT & Software)");
        log.info("• Human Resources (HR & People)");
        log.info("• Finance (Accounting & Treasury)");
        log.info("• Marketing (Brand & Advertising)");
        log.info("• Sales (Customer Acquisition)");
        log.info("• Operations (Business Operations)");
        log.info("• Legal (Compliance & Contracts)");
        log.info("• Research & Development (Innovation)");
        log.info("• Customer Service (Support)");
        log.info("• Quality Assurance (QA & Testing)");
        log.info("• Procurement (Purchasing)");
        log.info("• Training & Development (Learning)");
        log.info("• Security (Safety & Protection)");
        log.info("• Facilities Management (Building Services)");
        log.info("• Business Development (Growth)");

        log.info("");
        log.info("Example Sub-Departments:");
        log.info("• IT: Software Development, Network Admin, Help Desk, Cybersecurity");
        log.info("• Finance: Accounting, Treasury, Internal Audit");
        log.info("• Marketing: Digital Marketing, Content Creation, Market Research");
        log.info("• HR: Recruitment, Employee Relations, Payroll");

        log.info("=".repeat(60));
        log.info("All departments are ready for user assignment and management!");
        log.info("=".repeat(60));
    }

    private void logBusinessRolesAndPermissions() {
        log.info("=".repeat(60));
        log.info("BUSINESS ROLES AND PERMISSIONS ASSIGNED");
        log.info("=".repeat(60));

        roleRepository.findAll().forEach(role -> {
            log.info("Role name: {}", role.getName());
            log.info("Permissions: {}", role.getPermissions());
            log.info("");
        });

        log.info("=".repeat(60));
        log.info("All business roles and permissions are set up!");
        log.info("=".repeat(60));
    }
}
