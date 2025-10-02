package com.mnp.identity.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.mnp.identity.dto.response.PositionResponse;
import com.mnp.identity.entity.Position;

@Mapper(componentModel = "spring")
public interface PositionMapper {
    @Mapping(
            target = "departmentId",
            expression = "java(position.getDepartment() != null ? position.getDepartment().getId() : null)")
    @Mapping(
            target = "departmentName",
            expression = "java(position.getDepartment() != null ? position.getDepartment().getName() : null)")
    PositionResponse toPositionResponse(Position position);
}
