package com.mnp.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.mnp.identity.dto.request.DepartmentCreationRequest;
import com.mnp.identity.dto.request.DepartmentUpdateRequest;
import com.mnp.identity.dto.response.DepartmentResponse;
import com.mnp.identity.entity.Department;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {

    Department toDepartment(DepartmentCreationRequest request);

    @Mapping(
            target = "userCount",
            expression = "java(department.getUsers() != null ? (long) department.getUsers().size() : 0L)")
    DepartmentResponse toDepartmentResponse(Department department);

    void updateDepartment(@MappingTarget Department department, DepartmentUpdateRequest request);
}
