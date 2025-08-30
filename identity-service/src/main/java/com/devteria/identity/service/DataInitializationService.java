package com.devteria.identity.service;

import java.util.Arrays;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import com.devteria.identity.entity.Department;
import com.devteria.identity.repository.DepartmentRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DataInitializationService implements CommandLineRunner {

    DepartmentRepository departmentRepository;

    @Override
    public void run(String... args) throws Exception {
        initializeDepartments();
    }

    private void initializeDepartments() {
        List<String> defaultDepartments = Arrays.asList(
                "Information Technology",
                "Human Resources",
                "Finance",
                "Marketing",
                "Sales",
                "Operations",
                "Customer Service",
                "Legal",
                "Research and Development",
                "Quality Assurance");

        log.info("Initializing default departments...");

        for (String departmentName : defaultDepartments) {
            if (!departmentRepository.existsByName(departmentName)) {
                Department department =
                        Department.builder().name(departmentName).build();

                departmentRepository.save(department);
                log.info("Created department: {}", departmentName);
            } else {
                log.info("Department already exists: {}", departmentName);
            }
        }

        log.info("Department initialization completed.");
    }
}
