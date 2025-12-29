package com.mnp.task.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.entity.TaskSubmission;
import org.mapstruct.Mapper;

import java.util.Collections;
import java.util.List;

@Mapper(componentModel = "spring")
public interface TaskSubmissionMapper {

    default TaskSubmissionResponse toTaskSubmissionResponse(TaskSubmission submission, String projectName, String teamLeadName, String submitByName, String reviewByName){
        return TaskSubmissionResponse.builder()
                .id(submission.getId())
                .taskId(submission.getTaskId())
                .submittedBy(submitByName)
                .description(submission.getDescription())
                .attachments(parseAttachments(submission.getAttachmentsJson()))
                .status(submission.getStatus())
                .reviewComments(submission.getReviewComments())
                .reviewedBy(reviewByName)
                .reviewedAt(submission.getReviewedAt())
                .submittedAt(submission.getSubmittedAt())
                .projectName(projectName)
                .teamLeadName(teamLeadName)
                .build();
    }

    default List<TaskSubmissionRequest.AttachmentInfo> parseAttachments(String attachmentsJson) {
        if (attachmentsJson == null || attachmentsJson.isEmpty()) {
            return Collections.emptyList();
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(attachmentsJson,
                    new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}
