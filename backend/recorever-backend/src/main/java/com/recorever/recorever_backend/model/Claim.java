package com.recorever.recorever_backend.model;

public class Claim {
    private int claim_id;
    private int report_id;
    private int user_id;
    private String proof_description;
    private String item_name;
    private String status; // 'pending', 'approved', 'rejected'
    private String created_at;

    // Getters and Setters
    public int getClaim_id() { return claim_id; }
    public void setClaim_id(int claim_id) { this.claim_id = claim_id; }

    public int getReport_id() { return report_id; }
    public void setReport_id(int report_id) { this.report_id = report_id; }

    public int getUser_id() { return user_id; }
    public void setUser_id(int user_id) { this.user_id = user_id; }

    public String getProof_description() { return proof_description; }
    public void setProof_description(String proof_description) { this.proof_description = proof_description; }

    public String getItem_name() { return item_name; }
    public void setItem_name(String item_name) { this.item_name = item_name; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreated_at() { return created_at; }
    public void setCreated_at(String created_at) { this.created_at = created_at; }
}