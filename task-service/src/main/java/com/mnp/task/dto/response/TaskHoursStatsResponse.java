package com.mnp.task.dto.response;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskHoursStatsResponse {
    private String userId;
    private String userName;
    private String email;
    private Integer totalEstimatedHours;
    private Integer totalActualHours;
    private Integer hoursVariance;
    private Integer taskCount;
    private List<TaskSummary> tasks;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskSummary {
        private String taskId;
        private String title;
        private String status;
        private Integer estimatedHours;
        private Integer actualHours;
    }
}
