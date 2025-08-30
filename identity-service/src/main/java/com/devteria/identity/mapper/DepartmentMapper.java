package com.devteria.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.devteria.identity.dto.request.DepartmentCreationRequest;
import com.devteria.identity.dto.request.DepartmentUpdateRequest;
import com.devteria.identity.dto.response.DepartmentResponse;
import com.devteria.identity.entity.Department;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {

    Department toDepartment(DepartmentCreationRequest request);

    @Mapping(
            target = "userCount",
            expression = "java(department.getUsers() != null ? (long) department.getUsers().size() : 0L)")
    DepartmentResponse toDepartmentResponse(Department department);

    void updateDepartment(@MappingTarget Department department, DepartmentUpdateRequest request);
}
