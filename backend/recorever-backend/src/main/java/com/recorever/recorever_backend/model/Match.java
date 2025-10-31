package com.recorever.recorever_backend.model;

public class Match {
    private int match_id;
    private int lost_report_id; 
    private int found_report_id;
    private String status; // 'pending', 'confirmed', 'rejected'
    private String created_at;

    // Getters and Setters
    public int getMatch_id() { return match_id; }
    public void setMatch_id(int match_id) { this.match_id = match_id; }

    public int getLost_report_id() { return lost_report_id; }
    public void setLost_report_id(int lost_report_id) { this.lost_report_id = lost_report_id; }

    public int getFound_report_id() { return found_report_id; }
    public void setFound_report_id(int found_report_id) { this.found_report_id = found_report_id; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreated_at() { return created_at; }
    public void setCreated_at(String created_at) { this.created_at = created_at; }
}