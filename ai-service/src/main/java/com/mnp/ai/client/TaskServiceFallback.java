package com.mnp.ai.client;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mnp.ai.dto.TaskResponse;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class TaskServiceFallback implements TaskServiceClient {
    @Override
    public TaskResponse getTask(String taskId) {
        log.warn("Task service is unavailable, returning fallback for taskId: {}", taskId);

        return TaskResponse.builder()
                .id(taskId)
                .title("Fallback Task")
                .description("Task service unavailable")
                .type("DEVELOPMENT")
                .priority("MEDIUM")
                .status("PENDING")
                .estimatedHours(8)
                .requiredSkills(List.of("Java", "Spring Boot"))
                .taskType("BACKEND_DEVELOPMENT")
                .department("BE")
                .difficulty("MEDIUM")
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Override
    public List<TaskResponse> getTasksByUser(String userId, int limit) {
        log.warn("Task service is unavailable, returning empty list for userId: {}", userId);
        return Collections.emptyList();
    }

    @Override
    public List<TaskResponse> getTaskHistory(String userId, int limit) {
        log.warn("Task service is unavailable, returning empty task history for userId: {}", userId);
        return Collections.emptyList();
    }

    @Override
    public List<TaskResponse> getTasksByType(String taskType) {
        log.warn("Task service is unavailable, returning empty list for taskType: {}", taskType);
        return Collections.emptyList();
    }

    @Override
    public TaskResponse createTask(Object taskRequest) {
        log.warn("Task service is unavailable, returning fallback task creation response");

        return TaskResponse.builder()
                .id("FALLBACK-" + System.currentTimeMillis())
                .title("Fallback Task Creation")
                .description("Task service unavailable during creation")
                .type("DEVELOPMENT")
                .priority("MEDIUM")
                .status("PENDING")
                .estimatedHours(8)
                .createdAt(LocalDateTime.now())
                .build();
    }
}
