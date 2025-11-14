package com.recorever.recorever_backend.repository;

import com.recorever.recorever_backend.model.Notification;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class NotificationRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Notification> notificationMapper = (rs, rowNum) -> {
        Notification n = new Notification();
        n.setNotif_id(rs.getInt("notif_id"));
        n.setUser_id(rs.getInt("user_id"));
        n.setReport_id(rs.getInt("report_id"));
        n.setMessage(rs.getString("message"));
        n.setStatus(rs.getString("status"));
        n.setCreated_at(rs.getString("created_at"));
        return n;
    };

    public int createNotification(int userId, int reportId, String message) {
        String sql = "INSERT INTO notifications (user_id, report_id, message, status, created_at) VALUES (?, ?, ?, 'unread', NOW())";
        jdbcTemplate.update(sql, userId, reportId, message);
        
        return jdbcTemplate.queryForObject("SELECT LAST_INSERT_ID()", Integer.class);
    }

    public List<Notification> getNotificationsByUserId(int userId, int limit, int offset) {
        String sql = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?";
        return jdbcTemplate.query(sql, notificationMapper, userId, limit, offset);
    }

    public int countNotificationsByUserId(int userId) {
        String sql = "SELECT COUNT(*) FROM notifications WHERE user_id = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, userId);
        return (count != null) ? count : 0;
    }

    public boolean markAsRead(int notifId) {
        String sql = "UPDATE notifications SET status = 'read' WHERE notif_id = ?";
        return jdbcTemplate.update(sql, notifId) > 0;
    }
    
    public Notification getNotificationById(int notifId) {
        try {
            String sql = "SELECT * FROM notifications WHERE notif_id = ?";
            return jdbcTemplate.queryForObject(sql, notificationMapper, notifId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }
}
