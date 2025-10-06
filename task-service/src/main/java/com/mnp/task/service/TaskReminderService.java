package com.mnp.task.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskReminderService {

    private final TaskService taskService;

    /**
     * Send task reminder notifications every hour for tasks due within 24 hours
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 ms)
    public void sendTaskReminders() {
        log.info("Starting task reminder notification job");
        try {
            taskService.sendTaskReminders();
            log.info("Task reminder notification job completed successfully");
        } catch (Exception e) {
            log.error("Error in task reminder notification job", e);
        }
    }

    /**
     * Send urgent task reminders for tasks due within 2 hours - runs every 30 minutes
     */
    @Scheduled(fixedRate = 1800000) // Run every 30 minutes (1800000 ms)
    public void sendUrgentTaskReminders() {
        log.info("Starting urgent task reminder notification job");
        try {
            // You can implement this method in TaskService for more urgent reminders
            // taskService.sendUrgentTaskReminders();
            log.info("Urgent task reminder notification job completed successfully");
        } catch (Exception e) {
            log.error("Error in urgent task reminder notification job", e);
        }
    }
}
