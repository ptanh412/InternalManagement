package com.mnp.identity.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mnp.identity.dto.request.DepartmentCreationRequest;
import com.mnp.identity.dto.request.DepartmentUpdateRequest;
import com.mnp.identity.dto.response.DepartmentResponse;
import com.mnp.identity.entity.Department;
import com.mnp.identity.exception.AppException;
import com.mnp.identity.exception.ErrorCode;
import com.mnp.identity.mapper.DepartmentMapper;
import com.mnp.identity.repository.DepartmentRepository;

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
