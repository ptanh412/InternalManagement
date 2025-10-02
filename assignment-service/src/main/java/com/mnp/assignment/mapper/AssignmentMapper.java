package com.mnp.assignment.mapper;

import com.mnp.assignment.dto.request.CreateAssignmentRequest;
import com.mnp.assignment.dto.response.AssignmentResponse;
import com.mnp.assignment.dto.response.AssignmentHistoryResponse;
import com.mnp.assignment.entity.TaskAssignment;
import com.mnp.assignment.entity.AssignmentHistory;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AssignmentMapper {

    TaskAssignment toTaskAssignment(CreateAssignmentRequest request);

    AssignmentResponse toAssignmentResponse(TaskAssignment taskAssignment);

    AssignmentHistoryResponse toAssignmentHistoryResponse(AssignmentHistory assignmentHistory);
}
