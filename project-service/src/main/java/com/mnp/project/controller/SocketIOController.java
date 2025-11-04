package com.mnp.project.controller;

import com.mnp.project.dto.request.ApiResponse;
import com.mnp.project.service.SocketIOService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/socket")
@RequiredArgsConstructor
public class SocketIOController {

    private final SocketIOService socketIOService;

    @PostMapping("/test")
    public ApiResponse<String> testSocketIO(@RequestParam String message) {
        Map<String, Object> testData = new HashMap<>();
        testData.put("message", message);
        testData.put("timestamp", System.currentTimeMillis());
        testData.put("type", "TEST");

        socketIOService.sendNotification("test-message", testData, null);

        return ApiResponse.<String>builder()
                .result("Test message sent successfully via Socket.IO")
                .build();
    }

    @PostMapping("/notify")
    public ApiResponse<String> sendCustomNotification(
            @RequestParam String event,
            @RequestParam String message,
            @RequestParam(required = false) String room) {

        Map<String, Object> notificationData = new HashMap<>();
        notificationData.put("message", message);
        notificationData.put("timestamp", System.currentTimeMillis());
        notificationData.put("type", "CUSTOM");

        socketIOService.sendNotification(event, notificationData, room);

        return ApiResponse.<String>builder()
                .result("Custom notification sent successfully")
                .build();
    }


    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> getSocketIOStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("status", "Socket.IO server is running");
        status.put("port", 9092);
        status.put("host", "localhost");
        status.put("timestamp", System.currentTimeMillis());

        return ApiResponse.<Map<String, Object>>builder()
                .result(status)
                .build();
    }
}
