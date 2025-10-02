package com.mnp.workload.dto.response;

import com.mnp.workload.enums.TaskPriority;
import com.mnp.workload.enums.TaskStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserCurrentTaskResponse {
     String id;
     String userId;
     String  taskTitle;
     String taskId;
     String taskName;
     String taskDescription;
     String taskStatus;
     String projectId;
     String projectName;
     Integer estimatedHours;
     Integer remainingHours;
     Integer actualHoursSpent;
     String startedAt;
     String lastUpdated;
    LocalDateTime assignedDate;
     String assignedTo;
     String assignedToName;
    LocalDateTime dueDate;

    Double progressPercentage;

    TaskPriority priority;

    TaskStatus status;







}
