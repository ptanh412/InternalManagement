package com.mnp.task.mapper;

import com.mnp.task.dto.request.TaskExtensionRequest;
import com.mnp.task.dto.response.TaskExtensionResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskExtension;
import org.springframework.stereotype.Component;

@Component
public class TaskExtensionMapper {

    private static final int MAX_EXTENSIONS_PER_TASK = 2;

    public TaskExtensionResponse toResponse(
            TaskExtension request,
            Task task,
            String requestedByName,
            String reviewedByName) {

        return TaskExtensionResponse.builder()
                .id(request.getId())
                .taskId(request.getTaskId())
                .taskTitle(task.getTitle())
                .requestedBy(request.getRequestedBy())
                .requestedByName(requestedByName)
                .reviewedBy(request.getReviewedBy())
                .reviewedByName(reviewedByName)
                .extensionHours(request.getExtensionHours())
                .newDueDate(request.getNewDueDate())
                .reason(request.getReason())
                .status(request.getStatus())
                .reviewComments(request.getReviewComments())
                .requestedAt(request.getRequestedAt())
                .reviewedAt(request.getReviewedAt())
                .originalEstimatedHours(task.getOriginalEstimatedHours())
                .currentEstimatedHours(task.getEstimatedHours())
                .originalDueDate(task.getOriginalDueDate())
                .currentDueDate(task.getDueDate())
                .extensionCount(task.getExtensionCount())
                .totalExtensionHours(task.getTotalExtensionHours())
                .remainingExtensions(MAX_EXTENSIONS_PER_TASK - task.getExtensionCount())
                .build();
    }
}
