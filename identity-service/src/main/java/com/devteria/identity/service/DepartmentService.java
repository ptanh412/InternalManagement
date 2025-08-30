package com.devteria.identity.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.devteria.identity.dto.request.DepartmentCreationRequest;
import com.devteria.identity.dto.request.DepartmentUpdateRequest;
import com.devteria.identity.dto.response.DepartmentResponse;
import com.devteria.identity.entity.Department;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.mapper.DepartmentMapper;
import com.devteria.identity.repository.DepartmentRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DepartmentService {

    DepartmentRepository departmentRepository;
    DepartmentMapper departmentMapper;

    public DepartmentResponse createDepartment(DepartmentCreationRequest request) {
        if (departmentRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.DEPARTMENT_EXISTED);
        }

        Department department = departmentMapper.toDepartment(request);

        return departmentMapper.toDepartmentResponse(departmentRepository.save(department));
    }

    public List<DepartmentResponse> getAllDepartments() {
        return departmentRepository.findAll().stream()
                .map(departmentMapper::toDepartmentResponse)
                .collect(Collectors.toList());
    }

    public DepartmentResponse getDepartment(String id) {
        return departmentMapper.toDepartmentResponse(departmentRepository
                .findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED)));
    }

    public DepartmentResponse updateDepartment(String departmentId, DepartmentUpdateRequest request) {
        Department department = departmentRepository
                .findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));

        if (request.getName() != null && !request.getName().equals(department.getName())) {
            if (departmentRepository.existsByName(request.getName())) {
                throw new AppException(ErrorCode.DEPARTMENT_EXISTED);
            }
        }

        departmentMapper.updateDepartment(department, request);

        return departmentMapper.toDepartmentResponse(departmentRepository.save(department));
    }

    public void deleteDepartment(String departmentId) {
        Department department = departmentRepository
                .findById(departmentId)
                .orElseThrow(() -> new AppException(ErrorCode.DEPARTMENT_NOT_EXISTED));

        // Check if department has users
        if (department.getUsers() != null && !department.getUsers().isEmpty()) {
            throw new AppException(ErrorCode.DEPARTMENT_HAS_USERS);
        }

        departmentRepository.deleteById(departmentId);
    }
}
