package com.recorever.recorever_backend.service;

import com.recorever.recorever_backend.model.Notification;
import com.recorever.recorever_backend.dto.NotificationResponseDTO;
import com.recorever.recorever_backend.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
