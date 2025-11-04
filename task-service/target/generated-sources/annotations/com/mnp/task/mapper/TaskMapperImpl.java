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
    date = "2025-10-21T11:38:19+0700",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.8 (Oracle Corporation)"
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
        task.projectId( request.getProjectId() );
        task.parentTaskId( request.getParentTaskId() );
        task.title( request.getTitle() );
        task.description( request.getDescription() );
        task.type( request.getType() );
        task.priority( request.getPriority() );
        task.status( request.getStatus() );
        task.estimatedHours( request.getEstimatedHours() );
        task.dueDate( request.getDueDate() );
        List<String> list = request.getTags();
        if ( list != null ) {
            task.tags( new ArrayList<String>( list ) );
        }
        task.comments( request.getComments() );

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
        taskResponse.id( task.getId() );
        taskResponse.title( task.getTitle() );
        taskResponse.projectId( task.getProjectId() );
        taskResponse.reporterId( task.getReporterId() );
        if ( task.getType() != null ) {
            taskResponse.type( task.getType().name() );
        }
        taskResponse.assignedTo( task.getAssignedTo() );
        taskResponse.description( task.getDescription() );
        taskResponse.status( task.getStatus() );
        taskResponse.priority( task.getPriority() );
        taskResponse.estimatedHours( task.getEstimatedHours() );
        taskResponse.actualHours( task.getActualHours() );
        taskResponse.progressPercentage( task.getProgressPercentage() );
        List<String> list = task.getTags();
        if ( list != null ) {
            taskResponse.tags( new ArrayList<String>( list ) );
        }
        taskResponse.createdBy( task.getCreatedBy() );
        taskResponse.dueDate( task.getDueDate() );
        taskResponse.createdAt( task.getCreatedAt() );
        taskResponse.updatedAt( task.getUpdatedAt() );

        return taskResponse.build();
    }

    @Override
    public void updateTask(Task task, TaskUpdateRequest request) {
        if ( request == null ) {
            return;
        }

        if ( request.getAssigneeId() != null ) {
            task.setAssignedTo( request.getAssigneeId() );
        }
        if ( request.getTitle() != null ) {
            task.setTitle( request.getTitle() );
        }
        if ( request.getDescription() != null ) {
            task.setDescription( request.getDescription() );
        }
        if ( request.getPriority() != null ) {
            task.setPriority( request.getPriority() );
        }
        if ( request.getStatus() != null ) {
            task.setStatus( request.getStatus() );
        }
        if ( request.getDueDate() != null ) {
            task.setDueDate( request.getDueDate() );
        }
    }
}
