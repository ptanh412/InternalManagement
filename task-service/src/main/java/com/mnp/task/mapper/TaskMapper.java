package com.mnp.task.mapper;

import com.mnp.task.dto.request.TaskCreationRequest;
import com.mnp.task.dto.request.TaskUpdateRequest;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.entity.Task;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;

@Mapper(componentModel = "spring", nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
public interface TaskMapper {

    @Mapping(source = "assigneeId", target = "assignedTo")
    @Mapping(source = "reporterId", target = "reporterId")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdBy", ignore = true) // Set in service
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "actualHours", ignore = true)
    @Mapping(target = "startedAt", ignore = true)
    @Mapping(target = "completedAt", ignore = true)
    @Mapping(target = "qualityRating", ignore = true)
    @Mapping(target = "qualityComments", ignore = true)
    @Mapping(target = "progressPercentage", constant = "0.0")
    Task toTask(TaskCreationRequest request);

    @Mapping(source = "assignedTo", target = "assigneeId")
    TaskResponse toTaskResponse(Task task);

    void updateTask(@MappingTarget Task task, TaskUpdateRequest request);
}
