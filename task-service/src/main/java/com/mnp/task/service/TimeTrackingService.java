package com.mnp.task.service;

import com.mnp.task.dto.request.StopTimerRequest;
import com.mnp.task.dto.response.TimeLogResponse;
import com.mnp.task.dto.response.TimerStatusResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskTimeLog;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.enums.TimeLogStatus;
import com.mnp.task.repository.TaskRepository;
import com.mnp.task.repository.TaskTimeLogRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j

public class TimeTrackingService {

    TaskTimeLogRepository timeLogRepository;
    TaskRepository taskRepository;

    /**
     * Bắt đầu timer cho task
     */
    @Transactional
    public TimerStatusResponse startTimer(String taskId, String userId) {
        // Kiểm tra task tồn tại
        log.info("Starting timer for task {} by user {}", taskId, userId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Kiểm tra task có được assign cho user này không
        if (!task.getAssignedTo().equals(userId)) {
            throw new RuntimeException("Task is not assigned to this user");
        }

        // Kiểm tra xem đã có timer đang chạy cho task này chưa
        Optional<TaskTimeLog> existingTimer = timeLogRepository
                .findByTaskIdAndUserIdAndStatus(taskId, userId, TimeLogStatus.RUNNING);

        if (existingTimer.isPresent()) {
            // Nếu đã có timer đang chạy, trả về status hiện tại
            log.warn("Timer already running for task {} by user {}", taskId, userId);
            return buildTimerStatusResponse(existingTimer.get(), taskId, userId);
        }

        // Tự động stop timer đang chạy của task khác (nếu có)
        stopAnyRunningTimer(userId);

        // Tạo time log mới
        TaskTimeLog timeLog = TaskTimeLog.builder()
                .taskId(taskId)
                .userId(userId)
                .startTime(LocalDateTime.now())
                .status(TimeLogStatus.RUNNING)
                .build();

        timeLog = timeLogRepository.save(timeLog);
        log.info("Timer started for task {} by user {}", taskId, userId);

        // Cập nhật task status nếu đang là TODO
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            task.setStartedAt(LocalDateTime.now());
            taskRepository.save(task);
            log.info("Task status updated to IN_PROGRESS: {}", taskId);
        }

        return buildTimerStatusResponse(timeLog, taskId, userId);
    }

    /**
     * Dừng timer cho task
     */
    @Transactional
    public TimerStatusResponse stopTimer(String taskId, String userId, StopTimerRequest request) {
        // Tìm timer đang chạy
        TaskTimeLog timeLog = timeLogRepository
                .findByTaskIdAndUserIdAndStatus(taskId, userId, TimeLogStatus.RUNNING)
                .orElseThrow(() -> new RuntimeException("No running timer found for this task"));

        LocalDateTime endTime = LocalDateTime.now();
        timeLog.setEndTime(endTime);
        timeLog.setStatus(TimeLogStatus.COMPLETED);

        // Tính duration
        int durationSeconds;
        if (request != null && request.getManualDurationSeconds() != null) {
            // Cho phép chỉnh sửa thủ công
            durationSeconds = request.getManualDurationSeconds();
        } else {
            durationSeconds = (int) Duration.between(timeLog.getStartTime(), endTime).getSeconds();
        }

        timeLog.setDurationSeconds(durationSeconds);

        timeLog = timeLogRepository.save(timeLog);
        log.info("Timer stopped for task {} by user {}. Duration: {}s", taskId, userId, durationSeconds);

        // Cập nhật actualHours của task
        updateTaskActualHours(taskId);

        return buildTimerStatusResponse(null, taskId, userId);
    }

    /**
     * Lấy status của timer
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public TimerStatusResponse getTimerStatus(String taskId, String userId) {
        Optional<TaskTimeLog> runningTimer = timeLogRepository
                .findByTaskIdAndUserIdAndStatus(taskId, userId, TimeLogStatus.RUNNING);

        return buildTimerStatusResponse(runningTimer.orElse(null), taskId, userId);
    }

    /**
     * Lấy lịch sử time logs của task
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<TimeLogResponse> getTaskTimeLogs(String taskId) {
        List<TaskTimeLog> timeLogs = timeLogRepository.findByTaskIdOrderByStartTimeDesc(taskId);
        return timeLogs.stream()
                .map(this::toTimeLogResponse)
                .collect(Collectors.toList());
    }

    /**
     * Chỉnh sửa time log
     */
    @Transactional
    public TimeLogResponse updateTimeLog(String logId, StopTimerRequest request) {
        TaskTimeLog timeLog = timeLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Time log not found"));

        if (timeLog.getStatus() == TimeLogStatus.RUNNING) {
            throw new RuntimeException("Cannot edit running timer. Stop it first.");
        }

        if (request.getManualDurationSeconds() != null) {
            timeLog.setDurationSeconds(request.getManualDurationSeconds());
        }

        timeLog = timeLogRepository.save(timeLog);
        updateTaskActualHours(timeLog.getTaskId());

        return toTimeLogResponse(timeLog);
    }

    /**
     * Xóa time log
     */
    @Transactional
    public void deleteTimeLog(String logId) {
        TaskTimeLog timeLog = timeLogRepository.findById(logId)
                .orElseThrow(() -> new RuntimeException("Time log not found"));

        if (timeLog.getStatus() == TimeLogStatus.RUNNING) {
            throw new RuntimeException("Cannot delete running timer. Stop it first.");
        }

        String taskId = timeLog.getTaskId();
        timeLogRepository.delete(timeLog);
        updateTaskActualHours(taskId);
    }

    // Helper methods

    private void stopAnyRunningTimer(String userId) {
        Optional<TaskTimeLog> runningTimer = timeLogRepository
                .findByUserIdAndStatus(userId, TimeLogStatus.RUNNING);

        if (runningTimer.isPresent()) {
            TaskTimeLog timer = runningTimer.get();
            timer.setEndTime(LocalDateTime.now());
            timer.setStatus(TimeLogStatus.COMPLETED);
            timer.setDurationSeconds(
                    (int) Duration.between(timer.getStartTime(), timer.getEndTime()).getSeconds()
            );
            timeLogRepository.save(timer);
            updateTaskActualHours(timer.getTaskId());
            log.info("Auto-stopped running timer for task {}", timer.getTaskId());
        }
    }

    private void updateTaskActualHours(String taskId) {
        Integer totalSeconds = timeLogRepository.getTotalLoggedSecondsForTask(taskId);
        int actualHours = (int) Math.ceil(totalSeconds / 3600.0);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setActualHours(actualHours);
        taskRepository.save(task);

        log.debug("Updated actualHours for task {}: {} hours", taskId, actualHours);
    }

    private TimerStatusResponse buildTimerStatusResponse(TaskTimeLog runningTimer, String taskId, String userId) {
        Integer totalSeconds = timeLogRepository.getTotalLoggedSecondsForTask(taskId);

        if (runningTimer != null && runningTimer.getStatus() == TimeLogStatus.RUNNING) {
            int currentSessionSeconds = (int) Duration.between(
                    runningTimer.getStartTime(),
                    LocalDateTime.now()
            ).getSeconds();

            return TimerStatusResponse.builder()
                    .isRunning(true)
                    .activeLogId(runningTimer.getId())
                    .startTime(runningTimer.getStartTime())
                    .totalLoggedSeconds(totalSeconds)
                    .currentSessionSeconds(currentSessionSeconds)
                    .taskId(taskId)
                    .userId(userId)
                    .build();
        }

        return TimerStatusResponse.builder()
                .isRunning(false)
                .activeLogId(null)
                .startTime(null)
                .totalLoggedSeconds(totalSeconds)
                .currentSessionSeconds(0)
                .taskId(taskId)
                .userId(userId)
                .build();
    }

    private TimeLogResponse toTimeLogResponse(TaskTimeLog timeLog) {
        return TimeLogResponse.builder()
                .id(timeLog.getId())
                .taskId(timeLog.getTaskId())
                .userId(timeLog.getUserId())
                .startTime(timeLog.getStartTime())
                .endTime(timeLog.getEndTime())
                .durationSeconds(timeLog.getDurationSeconds())
                .status(timeLog.getStatus())
                .createdAt(timeLog.getCreatedAt())
                .build();
    }
}
