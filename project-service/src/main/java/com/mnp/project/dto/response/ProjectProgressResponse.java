package com.mnp.project.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectProgressResponse {
    String projectId;
    String projectName;
    Double completionPercentage;
    Integer totalTasks;
    Integer completedTasks;
    Integer pendingTasks;
    LocalDateTime lastUpdated;
    List<MilestoneProgressResponse> milestones;
    Boolean isOnTrack;
    Integer daysRemaining;
}
