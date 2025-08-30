package com.devteria.notification.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class WebSocketController {

    @MessageMapping("/connect")
    @SendToUser("/queue/connection")
    public String handleConnection(Principal principal) {
        return "Connected successfully: " + (principal != null ? principal.getName() : "anonymous");
    }

    @MessageMapping("/test")
    @SendTo("/topic/test")
    public String handleTest(String message) {
        return "Echo: " + message;
    }
}
