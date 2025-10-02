package com.mnp.task.mapper;

import com.mnp.task.dto.request.TaskCreationRequest;
import com.mnp.task.dto.request.TaskUpdateRequest;
import com.mnp.task.dto.response.TaskResponse;
import com.mnp.task.entity.Task;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-10-02T15:57:41+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.43.0.v20250819-1513, environment: Java 21.0.8 (Eclipse Adoptium)"
)
@Component
public class TaskMapperImpl implements TaskMapper {

    @Override
    public Task toTask(TaskCreationRequest request) {
        if ( request == null ) {
            return null;
        }

        Task.TaskBuilder task = Task.builder();

        task.assignedTo( request.getAssigneeId() );
        task.reporterId( request.getReporterId() );
        task.comments( request.getComments() );
        task.description( request.getDescription() );
        task.dueDate( request.getDueDate() );
        task.estimatedHours( request.getEstimatedHours() );
        task.parentTaskId( request.getParentTaskId() );
        task.priority( request.getPriority() );
        task.projectId( request.getProjectId() );
        task.status( request.getStatus() );
        List<String> list = request.getTags();
        if ( list != null ) {
            task.tags( new ArrayList<String>( list ) );
        }
        task.title( request.getTitle() );
        task.type( request.getType() );

        task.progressPercentage( (double) 0.0 );

        return task.build();
    }

    @Override
    public TaskResponse toTaskResponse(Task task) {
        if ( task == null ) {
            return null;
        }

        TaskResponse.TaskResponseBuilder taskResponse = TaskResponse.builder();

        taskResponse.assigneeId( task.getAssignedTo() );
        taskResponse.actualHours( task.getActualHours() );
        taskResponse.assignedTo( task.getAssignedTo() );
        taskResponse.createdAt( task.getCreatedAt() );
        taskResponse.createdBy( task.getCreatedBy() );
        taskResponse.description( task.getDescription() );
        taskResponse.dueDate( task.getDueDate() );
        taskResponse.estimatedHours( task.getEstimatedHours() );
        taskResponse.id( task.getId() );
        taskResponse.priority( task.getPriority() );
        taskResponse.progressPercentage( task.getProgressPercentage() );
        taskResponse.projectId( task.getProjectId() );
        taskResponse.reporterId( task.getReporterId() );
        taskResponse.status( task.getStatus() );
        List<String> list = task.getTags();
        if ( list != null ) {
            taskResponse.tags( new ArrayList<String>( list ) );
        }
        taskResponse.title( task.getTitle() );
        if ( task.getType() != null ) {
            taskResponse.type( task.getType().name() );
        }
        taskResponse.updatedAt( task.getUpdatedAt() );

        return taskResponse.build();
    }

    @Override
    public void updateTask(Task task, TaskUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        if ( request.getDescription() != null ) {
            task.setDescription( request.getDescription() );
        }
        if ( request.getDueDate() != null ) {
            task.setDueDate( request.getDueDate() );
        }
        if ( request.getPriority() != null ) {
            task.setPriority( request.getPriority() );
        }
        if ( request.getStatus() != null ) {
            task.setStatus( request.getStatus() );
        }
        if ( request.getTitle() != null ) {
            task.setTitle( request.getTitle() );
        }
    }
}
