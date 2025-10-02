package com.mnp.identity.configuration;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mnp.identity.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.identity.dto.request.ApiResponse;
import com.mnp.identity.dto.request.UserSkillRequest;
import com.mnp.identity.dto.response.UserProfileResponse;
import com.mnp.identity.entity.Department;
import com.mnp.identity.entity.Position;
import com.mnp.identity.entity.Role;
import com.mnp.identity.entity.User;
import com.mnp.identity.enums.AvailabilityStatus;
import com.mnp.identity.enums.Permission;
import com.mnp.identity.enums.ProficiencyLevel;
import com.mnp.identity.enums.SeniorityLevel;
import com.mnp.identity.enums.SkillType;
import com.mnp.identity.mapper.InterServiceMapper;
import com.mnp.identity.repository.DepartmentRepository;
import com.mnp.identity.repository.PositionRepository;
import com.mnp.identity.repository.RoleRepository;
import com.mnp.identity.repository.UserRepository;
import com.mnp.identity.repository.httpclient.InternalProfileClient;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class ApplicationInitConfig {

    PasswordEncoder passwordEncoder;

    @NonFinal
    static final String ADMIN_USER_NAME = "admin";

    @NonFinal
    static final String ADMIN_PASSWORD = "admin";

    @Bean
    @ConditionalOnProperty(
            prefix = "spring",
            value = "datasource.driverClassName",
            havingValue = "com.mysql.cj.jdbc.Driver")
    ApplicationRunner applicationRunner(
            UserRepository userRepository,
            RoleRepository roleRepository,
            DepartmentRepository departmentRepository,
            PositionRepository positionRepository,
            InternalProfileClient internalProfileClient) { // Use InternalProfileClient instead of ProfileClient
        log.info("Initializing application with fresh database.....");
        return args -> {
            // Create departments with predefined IDs
            Department engineering = Department.builder()
                    .name("Engineering")
                    .description("Software development and technical architecture")
                    .code("ENG")
                    .build();

            Department frontendDev = Department.builder()
                    .name("Frontend Development")
                    .description("User interface and experience development")
                    .code("FE")
                    .build();

            Department backendDev = Department.builder()
                    .name("Backend Development")
                    .description("Server-side development and API management")
                    .code("BE")
                    .build();

            Department qa = Department.builder()
                    .name("Quality Assurance")
                    .description("Testing and quality control")
                    .code("QA")
                    .build();

            Department devOps = Department.builder()
                    .name("DevOps")
                    .description("Development operations and infrastructure")
                    .code("DO")
                    .build();

            Department mobile = Department.builder()
                    .name("Mobile Development")
                    .description("Mobile application development")
                    .code("MB")
                    .build();

            // Save departments only if they don't exist
            if (!departmentRepository.existsByName("Engineering")) {
                engineering = departmentRepository.save(engineering);
            } else {
                engineering = departmentRepository.findByName("Engineering").orElse(engineering);
            }

            if (!departmentRepository.existsByName("Frontend Development")) {
                frontendDev = departmentRepository.save(frontendDev);
            } else {
                frontendDev =
                        departmentRepository.findByName("Frontend Development").orElse(frontendDev);
            }

            if (!departmentRepository.existsByName("Backend Development")) {
                backendDev = departmentRepository.save(backendDev);
            } else {
                backendDev =
                        departmentRepository.findByName("Backend Development").orElse(backendDev);
            }

            if (!departmentRepository.existsByName("Quality Assurance")) {
                qa = departmentRepository.save(qa);
            } else {
                qa = departmentRepository.findByName("Quality Assurance").orElse(qa);
            }

            if (!departmentRepository.existsByName("DevOps")) {
                devOps = departmentRepository.save(devOps);
            } else {
                devOps = departmentRepository.findByName("DevOps").orElse(devOps);
            }

            if (!departmentRepository.existsByName("Mobile Development")) {
                mobile = departmentRepository.save(mobile);
            } else {
                mobile = departmentRepository.findByName("Mobile Development").orElse(mobile);
            }

            log.info("✓ Departments created/loaded successfully");

            // Create comprehensive positions for all seniority levels and departments

            // Frontend Development Positions
            Position frontendIntern = Position.builder()
                    .title("Frontend Development Intern")
                    .description("Entry-level frontend development intern")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.INTERN)
                    .requiredSkills(Map.of(
                            "HTML/CSS", 2.0,
                            "JavaScript", 1.0,
                            "Git", 1.0))
                    .build();

            Position frontendJunior = Position.builder()
                    .title("Junior Frontend Developer")
                    .description("Junior frontend developer with basic web development skills")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.JUNIOR)
                    .requiredSkills(Map.of(
                            "HTML/CSS", 3.0,
                            "JavaScript", 2.0,
                            "React", 2.0,
                            "Git", 2.0))
                    .build();

            Position frontendMid = Position.builder()
                    .title("Frontend Developer")
                    .description("Mid-level frontend developer with framework expertise")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.MID_LEVEL)
                    .requiredSkills(Map.of(
                            "JavaScript", 3.0,
                            "React", 3.0,
                            "HTML/CSS", 3.0,
                            "Testing", 2.0,
                            "UI/UX", 2.0))
                    .build();

            Position frontendSenior = Position.builder()
                    .title("Senior Frontend Developer")
                    .description("Senior frontend developer with full-stack capabilities")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.SENIOR)
                    .requiredSkills(Map.of(
                            "JavaScript", 4.0,
                            "React", 4.0,
                            "HTML/CSS", 4.0,
                            "UI/UX", 3.0,
                            "Testing", 3.0))
                    .build();

            Position frontendLead = Position.builder()
                    .title("Frontend Team Lead")
                    .description("Frontend team lead with leadership and architecture skills")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "JavaScript", 4.0,
                            "React", 4.0,
                            "Architecture", 3.0,
                            "Leadership", 4.0,
                            "Mentoring", 3.0))
                    .build();

            Position frontendPrincipal = Position.builder()
                    .title("Principal Frontend Engineer")
                    .description("Principal frontend engineer with strategic technical leadership")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "JavaScript", 5.0,
                            "Architecture", 4.0,
                            "Leadership", 4.0,
                            "Strategy", 4.0,
                            "Innovation", 4.0))
                    .build();

            // Backend Development Positions
            Position backendIntern = Position.builder()
                    .title("Backend Development Intern")
                    .description("Entry-level backend development intern")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.INTERN)
                    .requiredSkills(Map.of(
                            "Java", 1.0,
                            "Database", 1.0,
                            "Git", 1.0))
                    .build();

            Position backendJunior = Position.builder()
                    .title("Junior Backend Developer")
                    .description("Junior backend developer with basic server-side skills")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.JUNIOR)
                    .requiredSkills(Map.of(
                            "Java", 2.0,
                            "Spring Boot", 2.0,
                            "Database", 2.0,
                            "REST API", 2.0))
                    .build();

            Position backendMid = Position.builder()
                    .title("Backend Developer")
                    .description("Mid-level backend developer with framework expertise")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.MID_LEVEL)
                    .requiredSkills(Map.of(
                            "Java", 3.0,
                            "Spring Boot", 3.0,
                            "Database", 3.0,
                            "Microservices", 2.0,
                            "API Design", 3.0))
                    .build();

            Position backendSenior = Position.builder()
                    .title("Senior Backend Developer")
                    .description("Senior backend developer with microservices expertise")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.SENIOR)
                    .requiredSkills(Map.of(
                            "Java", 4.0,
                            "Spring Boot", 4.0,
                            "Microservices", 4.0,
                            "Database", 3.0,
                            "API Design", 4.0,
                            "Testing", 3.0))
                    .build();

            Position backendLead = Position.builder()
                    .title("Backend Team Lead")
                    .description("Backend team lead with architecture and leadership skills")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "Java", 4.0,
                            "Architecture", 4.0,
                            "Microservices", 4.0,
                            "Leadership", 4.0,
                            "System Design", 4.0))
                    .build();

            Position backendPrincipal = Position.builder()
                    .title("Principal Backend Engineer")
                    .description("Principal backend engineer with enterprise architecture expertise")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "Java", 5.0,
                            "Architecture", 5.0,
                            "System Design", 5.0,
                            "Leadership", 4.0,
                            "Strategy", 4.0))
                    .build();

            // Quality Assurance Positions
            Position qaIntern = Position.builder()
                    .title("QA Intern")
                    .description("Entry-level quality assurance intern")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.INTERN)
                    .requiredSkills(Map.of(
                            "Manual Testing", 1.0,
                            "Test Cases", 1.0))
                    .build();

            Position qaJunior = Position.builder()
                    .title("Junior QA Engineer")
                    .description("Junior QA engineer with basic testing skills")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.JUNIOR)
                    .requiredSkills(Map.of(
                            "Manual Testing", 2.0,
                            "Test Cases", 2.0,
                            "Bug Reporting", 2.0,
                            "JIRA", 2.0))
                    .build();

            Position qaMid = Position.builder()
                    .title("QA Engineer")
                    .description("Mid-level QA engineer with automation skills")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.MID_LEVEL)
                    .requiredSkills(Map.of(
                            "Manual Testing", 3.0,
                            "Test Automation", 3.0,
                            "Test Planning", 3.0,
                            "JIRA", 3.0))
                    .build();

            Position qaSenior = Position.builder()
                    .title("Senior QA Engineer")
                    .description("Senior QA engineer with advanced automation expertise")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.SENIOR)
                    .requiredSkills(Map.of(
                            "Test Automation", 4.0,
                            "Manual Testing", 4.0,
                            "Test Planning", 4.0,
                            "Performance Testing", 3.0,
                            "CI/CD", 3.0))
                    .build();

            Position qaLead = Position.builder()
                    .title("QA Lead")
                    .description("Quality assurance lead with automation expertise")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "Test Automation", 4.0,
                            "Manual Testing", 4.0,
                            "Test Planning", 4.0,
                            "Leadership", 3.0,
                            "JIRA", 3.0))
                    .build();

            Position qaPrincipal = Position.builder()
                    .title("Principal QA Engineer")
                    .description("Principal QA engineer with quality strategy expertise")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "Quality Strategy", 4.0,
                            "Test Architecture", 4.0,
                            "Leadership", 4.0,
                            "Process Improvement", 4.0,
                            "Automation", 5.0))
                    .build();

            // DevOps Positions
            Position devOpsIntern = Position.builder()
                    .title("DevOps Intern")
                    .description("Entry-level DevOps intern")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.INTERN)
                    .requiredSkills(Map.of(
                            "Linux", 1.0,
                            "Git", 1.0,
                            "Docker", 1.0))
                    .build();

            Position devOpsJunior = Position.builder()
                    .title("Junior DevOps Engineer")
                    .description("Junior DevOps engineer with basic infrastructure skills")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.JUNIOR)
                    .requiredSkills(Map.of(
                            "Docker", 2.0,
                            "Linux", 2.0,
                            "CI/CD", 2.0,
                            "AWS", 1.0))
                    .build();

            Position devOpsMid = Position.builder()
                    .title("DevOps Engineer")
                    .description("Mid-level DevOps engineer with cloud expertise")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.MID_LEVEL)
                    .requiredSkills(Map.of(
                            "Docker", 3.0,
                            "Kubernetes", 2.0,
                            "AWS", 3.0,
                            "CI/CD", 3.0,
                            "Infrastructure", 3.0))
                    .build();

            Position devOpsSenior = Position.builder()
                    .title("Senior DevOps Engineer")
                    .description("Senior DevOps engineer with cloud infrastructure expertise")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.SENIOR)
                    .requiredSkills(Map.of(
                            "Docker", 4.0,
                            "Kubernetes", 3.0,
                            "AWS", 3.0,
                            "CI/CD", 4.0,
                            "Infrastructure", 4.0))
                    .build();

            Position devOpsLead = Position.builder()
                    .title("DevOps Team Lead")
                    .description("DevOps team lead with platform architecture skills")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "Platform Architecture", 4.0,
                            "Kubernetes", 4.0,
                            "Cloud Strategy", 4.0,
                            "Leadership", 4.0,
                            "Security", 3.0))
                    .build();

            Position devOpsPrincipal = Position.builder()
                    .title("Principal DevOps Engineer")
                    .description("Principal DevOps engineer with enterprise platform expertise")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "Cloud Architecture", 5.0,
                            "Platform Engineering", 5.0,
                            "Security", 4.0,
                            "Leadership", 4.0,
                            "Innovation", 4.0))
                    .build();

            // Mobile Development Positions
            Position mobileIntern = Position.builder()
                    .title("Mobile Development Intern")
                    .description("Entry-level mobile development intern")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.INTERN)
                    .requiredSkills(Map.of(
                            "Java", 1.0,
                            "Android", 1.0,
                            "Git", 1.0))
                    .build();

            Position mobileJunior = Position.builder()
                    .title("Junior Mobile Developer")
                    .description("Junior mobile developer with basic app development skills")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.JUNIOR)
                    .requiredSkills(Map.of(
                            "Android", 2.0,
                            "iOS", 1.0,
                            "Mobile UI", 2.0,
                            "API Integration", 2.0))
                    .build();

            Position mobileMid = Position.builder()
                    .title("Mobile Developer")
                    .description("Mid-level mobile developer with cross-platform expertise")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.MID_LEVEL)
                    .requiredSkills(Map.of(
                            "Android", 3.0,
                            "iOS", 3.0,
                            "React Native", 3.0,
                            "Mobile Architecture", 2.0,
                            "Performance", 3.0))
                    .build();

            Position mobileSenior = Position.builder()
                    .title("Senior Mobile Developer")
                    .description("Senior mobile developer with advanced platform expertise")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.SENIOR)
                    .requiredSkills(Map.of(
                            "Android", 4.0,
                            "iOS", 4.0,
                            "React Native", 4.0,
                            "Mobile Architecture", 4.0,
                            "Performance", 4.0))
                    .build();

            Position mobileLead = Position.builder()
                    .title("Mobile Team Lead")
                    .description("Mobile team lead with platform strategy expertise")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "Mobile Strategy", 4.0,
                            "Cross Platform", 4.0,
                            "Leadership", 4.0,
                            "App Store", 3.0,
                            "Performance", 4.0))
                    .build();

            Position mobilePrincipal = Position.builder()
                    .title("Principal Mobile Engineer")
                    .description("Principal mobile engineer with mobile platform architecture expertise")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "Mobile Architecture", 5.0,
                            "Platform Strategy", 5.0,
                            "Innovation", 4.0,
                            "Leadership", 4.0,
                            "Emerging Tech", 4.0))
                    .build();

            // Engineering Leadership Positions
            Position engineeringLead = Position.builder()
                    .title("Engineering Lead")
                    .description("Engineering lead with cross-functional technical leadership")
                    .department(engineering)
                    .seniorityLevel(SeniorityLevel.LEAD)
                    .requiredSkills(Map.of(
                            "Technical Leadership", 4.0,
                            "Architecture", 4.0,
                            "Cross-functional", 4.0,
                            "Strategy", 3.0,
                            "Mentoring", 4.0))
                    .build();

            Position engineeringPrincipal = Position.builder()
                    .title("Principal Engineer")
                    .description("Principal engineer with enterprise technical strategy expertise")
                    .department(engineering)
                    .seniorityLevel(SeniorityLevel.PRINCIPAL)
                    .requiredSkills(Map.of(
                            "System Architecture", 5.0,
                            "Technical Strategy", 5.0,
                            "Innovation", 5.0,
                            "Leadership", 4.0,
                            "Research", 4.0))
                    .build();

            // Director-level positions for each department
            Position frontendDirector = Position.builder()
                    .title("Director of Frontend Engineering")
                    .description("Executive director of frontend engineering with strategic leadership")
                    .department(frontendDev)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Strategic Leadership", 5.0,
                            "Technical Vision", 5.0,
                            "Team Building", 5.0,
                            "Business Strategy", 4.0,
                            "Innovation", 5.0))
                    .build();

            Position backendDirector = Position.builder()
                    .title("Director of Backend Engineering")
                    .description("Executive director of backend engineering with enterprise strategy")
                    .department(backendDev)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Strategic Leadership", 5.0,
                            "Enterprise Architecture", 5.0,
                            "Team Building", 5.0,
                            "Business Strategy", 4.0,
                            "Scalability", 5.0))
                    .build();

            Position qaDirector = Position.builder()
                    .title("Director of Quality Assurance")
                    .description("Executive director of quality assurance with quality strategy")
                    .department(qa)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Quality Strategy", 5.0,
                            "Process Excellence", 5.0,
                            "Strategic Leadership", 5.0,
                            "Automation Strategy", 4.0,
                            "Risk Management", 4.0))
                    .build();

            Position devOpsDirector = Position.builder()
                    .title("Director of DevOps")
                    .description("Executive director of DevOps with platform strategy")
                    .department(devOps)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Platform Strategy", 5.0,
                            "Cloud Strategy", 5.0,
                            "Strategic Leadership", 5.0,
                            "Infrastructure", 4.0,
                            "Security Strategy", 4.0))
                    .build();

            Position mobileDirector = Position.builder()
                    .title("Director of Mobile Engineering")
                    .description("Executive director of mobile engineering with mobile strategy")
                    .department(mobile)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Mobile Strategy", 5.0,
                            "Product Strategy", 5.0,
                            "Strategic Leadership", 5.0,
                            "Innovation", 4.0,
                            "Market Analysis", 4.0))
                    .build();

            Position engineeringDirector = Position.builder()
                    .title("Director of Engineering")
                    .description("Executive director of engineering with technical and business strategy")
                    .department(engineering)
                    .seniorityLevel(SeniorityLevel.DIRECTOR)
                    .requiredSkills(Map.of(
                            "Executive Leadership", 5.0,
                            "Technical Strategy", 5.0,
                            "Business Strategy", 5.0,
                            "Innovation", 5.0,
                            "Organizational Design", 4.0))
                    .build();

            // Save positions with existence checks to prevent duplicates
            if (!positionRepository.existsByTitle("Frontend Development Intern")) {
                positionRepository.save(frontendIntern);
            }
            if (!positionRepository.existsByTitle("Junior Frontend Developer")) {
                positionRepository.save(frontendJunior);
            }
            if (!positionRepository.existsByTitle("Frontend Developer")) {
                positionRepository.save(frontendMid);
            }
            if (!positionRepository.existsByTitle("Senior Frontend Developer")) {
                positionRepository.save(frontendSenior);
            }
            if (!positionRepository.existsByTitle("Frontend Team Lead")) {
                positionRepository.save(frontendLead);
            }
            if (!positionRepository.existsByTitle("Principal Frontend Engineer")) {
                positionRepository.save(frontendPrincipal);
            }
            if (!positionRepository.existsByTitle("Backend Development Intern")) {
                positionRepository.save(backendIntern);
            }
            if (!positionRepository.existsByTitle("Junior Backend Developer")) {
                positionRepository.save(backendJunior);
            }
            if (!positionRepository.existsByTitle("Backend Developer")) {
                positionRepository.save(backendMid);
            }
            if (!positionRepository.existsByTitle("Senior Backend Developer")) {
                positionRepository.save(backendSenior);
            }
            if (!positionRepository.existsByTitle("Backend Team Lead")) {
                positionRepository.save(backendLead);
            }
            if (!positionRepository.existsByTitle("Principal Backend Engineer")) {
                positionRepository.save(backendPrincipal);
            }
            if (!positionRepository.existsByTitle("QA Intern")) {
                positionRepository.save(qaIntern);
            }
            if (!positionRepository.existsByTitle("Junior QA Engineer")) {
                positionRepository.save(qaJunior);
            }
            if (!positionRepository.existsByTitle("QA Engineer")) {
                positionRepository.save(qaMid);
            }
            if (!positionRepository.existsByTitle("Senior QA Engineer")) {
                positionRepository.save(qaSenior);
            }
            if (!positionRepository.existsByTitle("QA Lead")) {
                positionRepository.save(qaLead);
            }
            if (!positionRepository.existsByTitle("Principal QA Engineer")) {
                positionRepository.save(qaPrincipal);
            }
            if (!positionRepository.existsByTitle("DevOps Intern")) {
                positionRepository.save(devOpsIntern);
            }
            if (!positionRepository.existsByTitle("Junior DevOps Engineer")) {
                positionRepository.save(devOpsJunior);
            }
            if (!positionRepository.existsByTitle("DevOps Engineer")) {
                positionRepository.save(devOpsMid);
            }
            if (!positionRepository.existsByTitle("Senior DevOps Engineer")) {
                positionRepository.save(devOpsSenior);
            }
            if (!positionRepository.existsByTitle("DevOps Team Lead")) {
                positionRepository.save(devOpsLead);
            }
            if (!positionRepository.existsByTitle("Principal DevOps Engineer")) {
                positionRepository.save(devOpsPrincipal);
            }
            if (!positionRepository.existsByTitle("Mobile Development Intern")) {
                positionRepository.save(mobileIntern);
            }
            if (!positionRepository.existsByTitle("Junior Mobile Developer")) {
                positionRepository.save(mobileJunior);
            }
            if (!positionRepository.existsByTitle("Mobile Developer")) {
                positionRepository.save(mobileMid);
            }
            if (!positionRepository.existsByTitle("Senior Mobile Developer")) {
                positionRepository.save(mobileSenior);
            }
            if (!positionRepository.existsByTitle("Mobile Team Lead")) {
                positionRepository.save(mobileLead);
            }
            if (!positionRepository.existsByTitle("Principal Mobile Engineer")) {
                positionRepository.save(mobilePrincipal);
            }
            if (!positionRepository.existsByTitle("Engineering Lead")) {
                positionRepository.save(engineeringLead);
            }
            if (!positionRepository.existsByTitle("Principal Engineer")) {
                positionRepository.save(engineeringPrincipal);
            }
            if (!positionRepository.existsByTitle("Director of Frontend Engineering")) {
                positionRepository.save(frontendDirector);
            }
            if (!positionRepository.existsByTitle("Director of Backend Engineering")) {
                positionRepository.save(backendDirector);
            }
            if (!positionRepository.existsByTitle("Director of Quality Assurance")) {
                positionRepository.save(qaDirector);
            }
            if (!positionRepository.existsByTitle("Director of DevOps")) {
                positionRepository.save(devOpsDirector);
            }
            if (!positionRepository.existsByTitle("Director of Mobile Engineering")) {
                positionRepository.save(mobileDirector);
            }
            if (!positionRepository.existsByTitle("Director of Engineering")) {
                positionRepository.save(engineeringDirector);
            }

            log.info("✓ Positions created/loaded successfully");

            // Create roles with auto-generated UUIDs and permissions
            Role adminRole = Role.builder()
                    .name("ADMIN")
                    .description("System administrator with full access")
                    .permissions(Set.of(
                            Permission.MANAGE_USERS,
                            Permission.MANAGE_SYSTEM_SETTINGS,
                            Permission.VIEW_ALL_REPORTS,
                            Permission.CREATE_PROJECTS,
                            Permission.ASSIGN_TASKS,
                            Permission.MANAGE_DEPARTMENTS,
                            Permission.MANAGE_POSITIONS,
                            Permission.MANAGE_ROLES,
                            Permission.VIEW_ANALYTICS,
                            Permission.EXPORT_DATA))
                    .build();

            Role projectManagerRole = Role.builder()
                    .name("PROJECT_MANAGER")
                    .description("Project manager with project oversight capabilities")
                    .permissions(Set.of(
                            Permission.CREATE_PROJECTS,
                            Permission.EDIT_PROJECTS,
                            Permission.VIEW_PROJECTS,
                            Permission.ASSIGN_TASKS,
                            Permission.VIEW_ALL_REPORTS,
                            Permission.VIEW_USER_PROFILES))
                    .build();

            Role teamLeadRole = Role.builder()
                    .name("TEAM_LEAD")
                    .description("Team lead with team management capabilities")
                    .permissions(Set.of(
                            Permission.ASSIGN_TASKS,
                            Permission.VIEW_PROJECTS,
                            Permission.EDIT_PROJECTS,
                            Permission.VIEW_USER_PROFILES,
                            Permission.VIEW_ANALYTICS))
                    .build();

            Role employeeRole = Role.builder()
                    .name("EMPLOYEE")
                    .description("Standard employee with basic access")
                    .permissions(Set.of(Permission.VIEW_PROJECTS, Permission.VIEW_USER_PROFILES))
                    .build();

            // Save roles with name-based duplicate check
            if (!roleRepository.existsByName("ADMIN")) {
                adminRole = roleRepository.save(adminRole);
            } else {
                adminRole = roleRepository.findByName("ADMIN").orElse(adminRole);
            }
            if (!roleRepository.existsByName("PROJECT_MANAGER")) {
                projectManagerRole = roleRepository.save(projectManagerRole);
            } else {
                projectManagerRole =
                        roleRepository.findByName("PROJECT_MANAGER").orElse(projectManagerRole);
            }
            if (!roleRepository.existsByName("TEAM_LEAD")) {
                teamLeadRole = roleRepository.save(teamLeadRole);
            } else {
                teamLeadRole = roleRepository.findByName("TEAM_LEAD").orElse(teamLeadRole);
            }
            if (!roleRepository.existsByName("EMPLOYEE")) {
                employeeRole = roleRepository.save(employeeRole);
            } else {
                employeeRole = roleRepository.findByName("EMPLOYEE").orElse(employeeRole);
            }

            log.info("✓ Roles created with auto-generated UUIDs and permissions");

            // Create admin user with auto-generated UUID and manual employeeId
            User adminUser = User.builder()
                    .username(ADMIN_USER_NAME)
                    .emailVerified(true)
                    .password(passwordEncoder.encode(ADMIN_PASSWORD))
                    .email("admin@company.com")
                    .firstName("System")
                    .lastName("Administrator")
                    .employeeId("EMP001") // Manually assigned employee ID
                    .phoneNumber("+1234567890")
                    .role(adminRole)
                    .position(backendSenior)
                    .department(backendDev)
                    .isActive(true)
                    .online(false)
                    .build();

            // Check if admin user already exists by username
            User savedAdminUser;
            if (userRepository.existsByUsername(ADMIN_USER_NAME)) {
                savedAdminUser = userRepository.findByUsername(ADMIN_USER_NAME).orElse(adminUser);
                log.info("✓ Admin user already exists, skipping creation");
            } else {
                savedAdminUser = userRepository.save(adminUser);
                log.info(
                        "✓ Admin user created with UUID: {} and employeeId: {}",
                        savedAdminUser.getId(),
                        savedAdminUser.getEmployeeId());

                try {
                    // Create skills using string-based enums for inter-service communication
                    List<UserSkillRequest> adminSkills = List.of(
                            UserSkillRequest.builder()
                                    .skillName("Java")
                                    .skillType(SkillType.PROGRAMMING_LANGUAGE)
                                    .proficiencyLevel(ProficiencyLevel.EXPERT)
                                    .yearsOfExperience(5)
                                    .lastUsed(LocalDate.now())
                                    .build(),
                            UserSkillRequest.builder()
                                    .skillName("Spring Boot")
                                    .skillType(SkillType.FRAMEWORK)
                                    .proficiencyLevel(ProficiencyLevel.EXPERT)
                                    .yearsOfExperience(4)
                                    .lastUsed(LocalDate.now())
                                    .build(),
                            UserSkillRequest.builder()
                                    .skillName("MySQL")
                                    .skillType(SkillType.DATABASE)
                                    .proficiencyLevel(ProficiencyLevel.ADVANCED)
                                    .yearsOfExperience(3)
                                    .lastUsed(LocalDate.now())
                                    .build(),
                            UserSkillRequest.builder()
                                    .skillName("Docker")
                                    .skillType(SkillType.TOOL)
                                    .proficiencyLevel(ProficiencyLevel.ADVANCED)
                                    .yearsOfExperience(2)
                                    .lastUsed(LocalDate.now())
                                    .build());

                    // Use inter-service mapper to convert to inter-service request
                    InterServiceMapper interServiceMapper = new InterServiceMapper();
                    InterServiceProfileCreationRequest interServiceRequest = interServiceMapper.toInterServiceRequest(
                            savedAdminUser.getId(),
                            null, // No avatar initially
                            LocalDate.of(2003, 1, 1), // Default DOB
                            "HCM City",
                            adminSkills,
                            AvailabilityStatus.AVAILABLE);

                    ApiResponse<UserProfileResponse> profileResponse =
                            internalProfileClient.createProfileInterService(interServiceRequest);
                    if (profileResponse != null && profileResponse.getResult() != null) {
                        log.info(
                                "✓ Admin profile created successfully with ID: {} and {} skills",
                                profileResponse.getResult().getId(),
                                adminSkills.size());
                    } else {
                        log.warn("⚠ Admin profile creation returned null or empty result");
                    }
                } catch (Exception e) {
                    log.error("❌ Failed to create admin profile: {}", e.getMessage());
                    // Don't fail the entire initialization if profile creation fails
                    log.info("   → Continuing initialization without admin profile...");
                }
            }

            // Create admin profile through InternalProfileClient (no authentication required)

            // Update backend department with admin as head
            backendDev.setHeadOfDepartment(savedAdminUser);
            departmentRepository.save(backendDev);

            log.info("========================================");
            log.info("🎉 APPLICATION INITIALIZATION COMPLETED");
            log.info("========================================");
            log.info("📧 Admin Login Credentials:");
            log.info("   Username: {}", ADMIN_USER_NAME);
            log.info("   Password: {} (PLEASE CHANGE THIS!)", ADMIN_PASSWORD);
            log.info("   Email: {}", adminUser.getEmail());
            log.info("   Position: {}", backendSenior.getTitle());
            log.info("   Department: {}", backendDev.getName());
            log.info("========================================");
        };
    }
}
