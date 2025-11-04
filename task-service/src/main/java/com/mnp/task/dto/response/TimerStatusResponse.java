package com.mnp.task.dto.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TimerStatusResponse {
     Boolean isRunning;
     String activeLogId;
     LocalDateTime startTime;
     Integer totalLoggedSeconds; // Tổng giây đã log cho task này
     Integer currentSessionSeconds; // Giây của session hiện tại
     String taskId;
     String userId;
}
