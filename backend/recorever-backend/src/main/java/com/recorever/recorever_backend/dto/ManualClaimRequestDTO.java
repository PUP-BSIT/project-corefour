package com.recorever.recorever_backend.dto;

public class ManualClaimRequestDTO {
    private Long report_id;
    private String claimant_name;
    private String contact_email;
    private String contact_phone;
    private String admin_remarks;

    // Getters and Setters
    public Long getReport_id() { return report_id; }
    public void setReport_id(Long report_id) { this.report_id = report_id; }
    
    public String getClaimant_name() { return claimant_name; }
    public void setClaimant_name(String claimant_name) { this.claimant_name = claimant_name; }
    
    public String getContact_email() { return contact_email; }
    public void setContact_email(String contact_email) { this.contact_email = contact_email; }
    
    public String getContact_phone() { return contact_phone; }
    public void setContact_phone(String contact_phone) { this.contact_phone = contact_phone; }
    
    public String getAdmin_remarks() { return admin_remarks; }
    public void setAdmin_remarks(String admin_remarks) { this.admin_remarks = admin_remarks; }
}
