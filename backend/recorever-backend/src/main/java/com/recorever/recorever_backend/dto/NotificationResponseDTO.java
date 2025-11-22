package com.recorever.recorever_backend.dto;

import com.recorever.recorever_backend.model.Notification;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class NotificationResponseDTO {
    private int notif_id;
    private int report_id;
    private String message;
    private String status; // 'unread' or 'read'
    private String created_at;

    public static NotificationResponseDTO from(Notification notification) {
        NotificationResponseDTO dto = new NotificationResponseDTO();
        dto.setNotif_id(notification.getNotif_id());
        dto.setReport_id(notification.getReport_id());
        dto.setMessage(notification.getMessage());
        dto.setStatus(notification.getStatus());
        dto.setCreated_at(notification.getCreated_at());
        return dto;
    }
}