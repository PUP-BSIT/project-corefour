package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Notification;
import com.recorever.recorever_backend.dto.NotificationResponseDTO;
import com.recorever.recorever_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    private final Map<Integer, SseConnection> userConnections = new java.util.concurrent.ConcurrentHashMap<>();

    private static class SseConnection {
        final SseEmitter emitter;
        final String role;

        SseConnection(SseEmitter emitter, String role) {
            this.emitter = emitter;
            this.role = role;
        }
    }

    public void addEmitter(int userId, String role, SseEmitter emitter) {
        this.userConnections.put(userId, new SseConnection(emitter, role));
    }

    public void removeEmitter(int userId) {
        this.userConnections.remove(userId);
    }

    public Map<String, Object> create(int userId,
                                      int reportId,
                                      String message,
                                      boolean isStatusUpdate) {
        int id = repo.createNotification(userId, reportId, message);

        Map<String, Object> notificationData = Map.of(
            "notif_id", id,
            "user_id", userId,
            "report_id", reportId,
            "message", message,
            "status", "unread",
            "created_at", "Just now"
        );

        if (isStatusUpdate) {
            sendPrivateNotification(userId, notificationData);
        } else {
            broadcastToAdmins(notificationData);
        }

        return notificationData;
    }

    private void broadcastToAdmins(Map<String, Object> data) {
        userConnections.forEach((userId, conn) -> {
            if ("ADMIN".equalsIgnoreCase(conn.role)) {
                try {
                    conn.emitter.send(SseEmitter.event()
                        .name("new-report")
                        .data(data));
                } catch (Exception e) {
                    userConnections.remove(userId);
                }
            }
        });
    }

    public void sendPrivateNotification(int userId,
                                        Map<String, Object> data) {
        SseConnection conn = userConnections.get(userId);
        if (conn != null) {
            try {
                conn.emitter.send(SseEmitter.event()
                    .name("status-update")
                    .data(data));
            } catch (Exception e) {
                userConnections.remove(userId);
            }
        }
    }

    public Map<String, Object> listByUserId(int userId, int page, int size) {
        int offset = (page - 1) * size;

        List<Notification> notifications = repo.getNotificationsByUserId(userId, size, offset);

        List<NotificationResponseDTO> dtos = notifications.stream()
            .map(NotificationResponseDTO::from)
            .collect(Collectors.toList());

        int totalItems = repo.countNotificationsByUserId(userId);

        int totalPages = (int) Math.ceil((double) totalItems / size);

        return Map.of(
            "items", dtos, // Return the list of DTOs
            "currentPage", page,
            "totalPages", totalPages,
            "totalItems", totalItems
        );
    }

    public boolean markAsRead(int notifId) {
        return repo.markAsRead(notifId);
    }
    
    public Notification getById(int notifId) {
        return repo.getNotificationById(notifId);
    }
}
