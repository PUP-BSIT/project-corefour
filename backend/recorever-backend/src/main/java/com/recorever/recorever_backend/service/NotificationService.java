package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Notification;
import com.recorever.recorever_backend.dto.NotificationResponseDTO;
import com.recorever.recorever_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    private final Map<Integer, SseConnection> userConnections = 
            new ConcurrentHashMap<>();

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

    @Transactional
    public Map<String, Object> create(int userId, int reportId, 
                                     String message, boolean isUpdate) {
        
        Notification notification = new Notification();
        notification.setUser_id(userId);
        notification.setReport_id(reportId);
        notification.setMessage(message);
        notification.setStatus("unread");
        notification.setCreated_at(LocalDateTime.now().toString());

        Notification saved = repo.save(notification);

        Map<String, Object> data = Map.of(
            "notif_id", saved.getNotif_id(),
            "user_id", userId,
            "report_id", reportId,
            "message", message,
            "status", "unread",
            "created_at", "Just now"
        );

        if (isUpdate) {
            sendPrivateNotification(userId, data);
        } else {
            broadcastToAdmins(data);
        }

        return data;
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

    public void sendPrivateNotification(int userId, Map<String, Object> data) {
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
        List<Notification> notifications = repo.findByUserId(
                userId, PageRequest.of(page - 1, size));

        List<NotificationResponseDTO> dtos = notifications.stream()
            .map(NotificationResponseDTO::from)
            .collect(Collectors.toList());

        int totalItems = repo.countByUserId(userId);
        int totalPages = (int) Math.ceil((double) totalItems / size);

        return Map.of(
            "items", dtos,
            "currentPage", page,
            "totalPages", totalPages,
            "totalItems", totalItems
        );
    }

    public boolean markAsRead(int notifId) {
        return repo.markAsRead(notifId) > 0;
    }
    
    public Notification getById(int notifId) {
        return repo.findById(notifId).orElse(null);
    }
}