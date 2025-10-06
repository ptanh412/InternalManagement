package com.mnp.assignment.mapper;

import com.mnp.assignment.dto.request.CreateAssignmentRequest;
import com.mnp.assignment.dto.response.AssignmentHistoryResponse;
import com.mnp.assignment.dto.response.AssignmentResponse;
import com.mnp.assignment.entity.AssignmentHistory;
import com.mnp.assignment.entity.TaskAssignment;
import java.util.ArrayList;
import java.util.List;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-10-02T17:06:24+0700",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.43.0.v20250819-1513, environment: Java 21.0.8 (Eclipse Adoptium)"
)
@Component
public class AssignmentMapperImpl implements AssignmentMapper {

    @Override
    public TaskAssignment toTaskAssignment(CreateAssignmentRequest request) {
        if ( request == null ) {
            return null;
        }

        TaskAssignment.TaskAssignmentBuilder taskAssignment = TaskAssignment.builder();

        taskAssignment.assigmentScore( request.getAssigmentScore() );
        taskAssignment.assignmentReason( request.getAssignmentReason() );
        taskAssignment.availabilityScore( request.getAvailabilityScore() );
        taskAssignment.candidateUserId( request.getCandidateUserId() );
        taskAssignment.performanceScore( request.getPerformanceScore() );
        taskAssignment.skillMatchScore( request.getSkillMatchScore() );
        taskAssignment.taskId( request.getTaskId() );
        taskAssignment.workLoadScore( request.getWorkLoadScore() );

        return taskAssignment.build();
    }

    @Override
    public AssignmentResponse toAssignmentResponse(TaskAssignment taskAssignment) {
        if ( taskAssignment == null ) {
            return null;
        }

        AssignmentResponse.AssignmentResponseBuilder assignmentResponse = AssignmentResponse.builder();

        assignmentResponse.assigmentScore( taskAssignment.getAssigmentScore() );
        assignmentResponse.assignedAt( taskAssignment.getAssignedAt() );
        assignmentResponse.assignmentReason( taskAssignment.getAssignmentReason() );
        assignmentResponse.availabilityScore( taskAssignment.getAvailabilityScore() );
        assignmentResponse.candidateUserId( taskAssignment.getCandidateUserId() );
        List<String> list = taskAssignment.getCandidateUsers();
        if ( list != null ) {
            assignmentResponse.candidateUsers( new ArrayList<String>( list ) );
        }
        assignmentResponse.createdAt( taskAssignment.getCreatedAt() );
        assignmentResponse.id( taskAssignment.getId() );
        assignmentResponse.isSelected( taskAssignment.getIsSelected() );
        assignmentResponse.performanceScore( taskAssignment.getPerformanceScore() );
        assignmentResponse.skillMatchScore( taskAssignment.getSkillMatchScore() );
        assignmentResponse.taskId( taskAssignment.getTaskId() );
        assignmentResponse.workLoadScore( taskAssignment.getWorkLoadScore() );

        return assignmentResponse.build();
    }

    @Override
    public AssignmentHistoryResponse toAssignmentHistoryResponse(AssignmentHistory assignmentHistory) {
        if ( assignmentHistory == null ) {
            return null;
        }

        AssignmentHistoryResponse.AssignmentHistoryResponseBuilder assignmentHistoryResponse = AssignmentHistoryResponse.builder();

        assignmentHistoryResponse.comments( assignmentHistory.getComments() );
        assignmentHistoryResponse.id( assignmentHistory.getId() );
        assignmentHistoryResponse.newAssignee( assignmentHistory.getNewAssignee() );
        assignmentHistoryResponse.previousAssignee( assignmentHistory.getPreviousAssignee() );
        assignmentHistoryResponse.reason( assignmentHistory.getReason() );
        assignmentHistoryResponse.reassignedAt( assignmentHistory.getReassignedAt() );
        assignmentHistoryResponse.reassignedBy( assignmentHistory.getReassignedBy() );
        assignmentHistoryResponse.taskId( assignmentHistory.getTaskId() );

        return assignmentHistoryResponse.build();
    }
}
