package com.recorever.recorever_backend.controller;

import com.recorever.recorever_backend.model.Notification;
import com.recorever.recorever_backend.model.User;
import com.recorever.recorever_backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api")
public class NotificationController {

    @Autowired
    private NotificationService service;

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    @GetMapping("/notifications/stream")
    public SseEmitter streamNotifications(Authentication authentication) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();
        String role = authenticatedUser.getRole();

        SseEmitter emitter = new SseEmitter(0L);

        service.addEmitter(userId, role, emitter);

        emitter.onCompletion(() -> service.removeEmitter(userId));
        emitter.onTimeout(() -> service.removeEmitter(userId));
        emitter.onError((e) -> service.removeEmitter(userId));

        new Thread(() -> {
            try {
                emitter.send(SseEmitter.event()
                        .name("connected")
                        .data("ok"));

                while (true) {
                    Thread.sleep(15000);
                    emitter.send(SseEmitter.event()
                            .name("ping")
                            .data(""));
                }
            } catch (Exception e) {
                emitter.complete();
            }
        }).start();

        return emitter;
    }

    @GetMapping("/notifications")
    public ResponseEntity<Map<String, Object>> listNotifications(
        Authentication authentication,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        Map<String, Object> paginatedResponse = service.listByUserId(userId, page, size);
        
        return ResponseEntity.ok(paginatedResponse);
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(Authentication authentication, @PathVariable int id) {

        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        Notification notification = service.getById(id);
        if (notification == null) {
            return ResponseEntity.status(404).body("Notification not found.");
        }

        if (notification.getUser_id() != userId) {
            return ResponseEntity.status(403).body("You are not authorized to access this notification.");
        }

        boolean updated = service.markAsRead(id);
        if (!updated) {
            return ResponseEntity.badRequest().body("Failed to mark notification as read.");
        }

        return ResponseEntity.ok(Map.of("success", true, "message", "Notification marked as read."));
    }

    // TEMPORARY: Endpoint to manually create a notification for testing the system event logic.
    @PostMapping("/notifications/test")
    public ResponseEntity<?> testNotification(Authentication authentication, 
                                              @RequestBody Map<String, ?> body) {
        User authenticatedUser = (User) authentication.getPrincipal();
        int userId = authenticatedUser.getUser_id();

        int reportId = (Integer) body.get("report_id");
        String message = (String) body.get("message");

        Map<String, Object> result = service.create(userId, reportId, message, true);
        return ResponseEntity.status(201).body(result);
    }
}