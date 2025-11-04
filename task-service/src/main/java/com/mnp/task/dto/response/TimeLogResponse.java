package com.mnp.task.dto.response;

import com.mnp.task.enums.TimeLogStatus;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TimeLogResponse {
     String id;
     String taskId;
     String userId;
     LocalDateTime startTime;
     LocalDateTime endTime;
     Integer durationSeconds;
     String notes;
     TimeLogStatus status;
     LocalDateTime createdAt;

    // Helper method
    public String getFormattedDuration() {
        if (durationSeconds == null) return "0h 0m";
        int hours = durationSeconds / 3600;
        int minutes = (durationSeconds % 3600) / 60;
        return String.format("%dh %dm", hours, minutes);
    }
}
