package com.recorever.recorever_backend.model;

public class Report {
    private int report_id;
    private int user_id;
    private String type; // 'lost' or 'found'
    private String item_name;
    private String location;
    private String date_reported;
    private String date_resolved;
    private String description;
    private String status; // 'pending', 'approved', 'matched', 'claimed'
    private String surrender_code;
    private String claim_code;
    private boolean is_deleted; // Soft delete flag

    // Getters and Setters
    public int getReport_id() { return report_id; }
    public void setReport_id(int report_id) { this.report_id = report_id; }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getItem_name() { return item_name; }
    public void setItem_name(String item_name) { this.item_name = item_name; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDate_reported() { return date_reported; }
    public void setDate_reported(String date_reported) { this.date_reported = date_reported; }

    public String getDate_resolved() { return date_resolved; }
    public void setDate_resolved(String date_resolved) { this.date_resolved = date_resolved; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSurrender_code() { return surrender_code; }
    public void setSurrender_code(String surrender_code) { this.surrender_code = surrender_code; }

    public String getClaim_code() { return claim_code; }
    public void setClaim_code(String claim_code) { this.claim_code = claim_code; }

    public boolean isIs_deleted() { return is_deleted; }
    public void setIs_deleted(boolean is_deleted) { this.is_deleted = is_deleted; }
}
