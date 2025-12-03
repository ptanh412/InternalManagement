package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignmentRequestDto {

    private TaskDetailsDto task;

    private List<String> excludeUserIds;

    private String requesterUserId;

    private String priority;

    private Integer maxRecommendations;

    private boolean useAIRecommendations;
}
