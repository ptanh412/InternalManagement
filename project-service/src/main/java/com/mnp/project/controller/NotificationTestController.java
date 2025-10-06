//package com.mnp.project.controller;
//
//import com.mnp.project.service.NotificationProducerService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@RestController
//@RequestMapping("/api/notifications/test")
//@RequiredArgsConstructor
//@Slf4j
//public class NotificationTestController {
//
//    private final NotificationProducerService notificationProducerService;
//
//    /**
//     * Test endpoint to demonstrate team lead project notification
//     */
//    @PostMapping("/team-lead-assignment")
//    public ResponseEntity<String> testTeamLeadNotification(
//            @RequestParam String teamLeadId,
//            @RequestParam String projectId,
//            @RequestParam String projectName,
//            @RequestParam String projectManagerName) {
//
//        try {
//            notificationProducerService.sendTeamLeadProjectNotification(
//                    teamLeadId, projectId, projectName, projectManagerName
//            );
//
//            return ResponseEntity.ok("Team lead notification sent successfully");
//        } catch (Exception e) {
//            log.error("Failed to send test notification", e);
//            return ResponseEntity.badRequest().body("Failed to send notification: " + e.getMessage());
//        }
//    }
//}
