package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Notification;
import com.recorever.recorever_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository repo;

    public Map<String, Object> create(int userId, int reportId, String message) {
        int id = repo.createNotification(userId, reportId, message);
        return Map.of(
            "notif_id", id,
            "user_id", userId,
            "message", message
        );
    }

    public List<Notification> listByUserId(int userId) {
        return repo.getNotificationsByUserId(userId);
    }

    public boolean markAsRead(int notifId) {
        return repo.markAsRead(notifId);
    }
    
    public Notification getById(int notifId) {
        return repo.getNotificationById(notifId);
    }
}
