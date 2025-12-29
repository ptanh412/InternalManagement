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
    @Mapping(target = "originalEstimatedHours", ignore = true)
    @Mapping(target = "originalDueDate", ignore = true)
    @Mapping(target = "extensionCount", ignore = true)
    @Mapping(target = "totalExtensionHours", ignore = true)
    @Mapping(target = "lastExtensionDate", ignore = true)
    @Mapping(target = "hadExtension", ignore = true )
    Task toTask(TaskCreationRequest request);

    @Mapping(source = "assignedTo", target = "assigneeId")
    @Mapping(source = "startedAt", target = "startedAt") // Thêm dòng này explicit
    @Mapping(source = "completedAt", target = "completedAt")
    @Mapping(source = "actualHours", target = "actualHours")
    @Mapping(target = "hasPendingExtension", ignore = true)  // ✅ NEW
    TaskResponse toTaskResponse(Task task);

    @Mapping(source = "assigneeId", target = "assignedTo")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "originalEstimatedHours", ignore = true)
    @Mapping(target = "originalDueDate", ignore = true)
    @Mapping(target = "extensionCount", ignore = true)
    @Mapping(target = "totalExtensionHours", ignore = true)
    @Mapping(target = "lastExtensionDate", ignore = true)
    @Mapping(target = "hadExtension", ignore = true)
    void updateTask(@MappingTarget Task task, TaskUpdateRequest request);
}
