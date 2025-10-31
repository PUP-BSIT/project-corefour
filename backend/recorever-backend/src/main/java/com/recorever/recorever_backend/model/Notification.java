package com.recorever.recorever_backend.model;

public class Notification {
    private int notif_id;
    private int user_id;
    private int report_id;
    private String message;
    private String status; // 'unread' or 'read'
    private String created_at;

    // Getters and Setters
    public int getNotif_id() { return notif_id; }
    public void setNotif_id(int notif_id) { this.notif_id = notif_id; }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public int getReport_id() { return report_id; }
    public void setReport_id(int report_id) { this.report_id = report_id; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreated_at() { return created_at; }
    public void setCreated_at(String created_at) { this.created_at = created_at; }
}
