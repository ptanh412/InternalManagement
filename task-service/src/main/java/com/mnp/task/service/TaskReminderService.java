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
     * Send deadline reminders for tasks due in 3 days or 1 day, or on deadline day
     * Runs daily at 9:00 AM (Monday to Friday)
     * Cron: second, minute, hour, day, month, weekday
     * 0 0 9 * * MON-FRI = At 9:00 AM, Monday through Friday
     */
    @Scheduled(cron = "0 0 9 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void sendDeadlineReminders() {
        log.info("Starting deadline reminder notification job at 9:00 AM");
        try {
            taskService.sendDeadlineReminders();
            log.info("Deadline reminder notification job completed successfully");
        } catch (Exception e) {
            log.error("Error in deadline reminder notification job", e);
        }
    }

    /**
     * Send overdue task reminders - Morning shift
     * Runs daily at 9:00 AM (Monday to Friday)
     */
    @Scheduled(cron = "0 0 9 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void sendOverdueRemindersMorning() {
        log.info("Starting overdue reminder notification job at 9:00 AM");
        try {
            taskService.sendOverdueReminders();
            log.info("Overdue reminder notification job (morning) completed successfully");
        } catch (Exception e) {
            log.error("Error in overdue reminder notification job (morning)", e);
        }
    }

    /**
     * Send overdue task reminders - Noon shift
     * Runs daily at 12:00 PM (Monday to Friday)
     */
    @Scheduled(cron = "0 0 12 * * MON-FRI", zone = "Asia/Ho_Chi_Minh")
    public void sendOverdueRemindersNoon() {
        log.info("Starting overdue reminder notification job at 12:00 PM");
        try {
            taskService.sendOverdueReminders();
            log.info("Overdue reminder notification job (noon) completed successfully");
        } catch (Exception e) {
            log.error("Error in overdue reminder notification job (noon)", e);
        }
    }
}
