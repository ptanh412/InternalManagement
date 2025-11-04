package com.mnp.task.controller;

import com.mnp.task.dto.request.StopTimerRequest;
import com.mnp.task.dto.response.TimeLogResponse;
import com.mnp.task.dto.response.TimerStatusResponse;
import com.mnp.task.service.AuthenticationService;
import com.mnp.task.service.TimeTrackingService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/tasks/{taskId}/timer")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TaskTimeTrackingController {

    TimeTrackingService timeTrackingService;
    AuthenticationService authenticationService;

    /**
     * Lấy trạng thái timer hiện tại
     */
    @GetMapping("/status")
    public ResponseEntity<TimerStatusResponse> getTimerStatus(
            @PathVariable String taskId,
            HttpServletRequest request) {
        String userId = authenticationService.getUserIdFromRequest(request);
        return ResponseEntity.ok(timeTrackingService.getTimerStatus(taskId, userId));
    }

    /**
     * Bắt đầu timer
     */
    @PostMapping("/start")
    public ResponseEntity<TimerStatusResponse> startTimer(
            @PathVariable String taskId,
            HttpServletRequest request) {
        String userId = authenticationService.getUserIdFromRequest(request);
        return ResponseEntity.ok(timeTrackingService.startTimer(taskId, userId));
    }

    /**
     * Dừng timer
     */
    @PostMapping("/stop")
    public ResponseEntity<TimerStatusResponse> stopTimer(
            @PathVariable String taskId,
            HttpServletRequest request,
            @RequestBody(required = false) StopTimerRequest stopRequest) {
        String userId = authenticationService.getUserIdFromRequest(request);
        return ResponseEntity.ok(timeTrackingService.stopTimer(taskId, userId, stopRequest));
    }

    /**
     * Lấy lịch sử time logs
     */
    @GetMapping("/logs")
    public ResponseEntity<List<TimeLogResponse>> getTimeLogs(@PathVariable String taskId) {
        return ResponseEntity.ok(timeTrackingService.getTaskTimeLogs(taskId));
    }

    /**
     * Chỉnh sửa time log
     */
    @PutMapping("/logs/{logId}")
    public ResponseEntity<TimeLogResponse> updateTimeLog(
            @PathVariable String taskId,
            @PathVariable String logId,
            @RequestBody StopTimerRequest request) {
        return ResponseEntity.ok(timeTrackingService.updateTimeLog(logId, request));
    }

    /**
     * Xóa time log
     */
    @DeleteMapping("/logs/{logId}")
    public ResponseEntity<Void> deleteTimeLog(
            @PathVariable String taskId,
            @PathVariable String logId) {
        timeTrackingService.deleteTimeLog(logId);
        return ResponseEntity.noContent().build();
    }
}
