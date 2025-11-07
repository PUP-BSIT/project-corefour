package com.recorever.recorever_backend.model;

public class Image {
    private int image_id;
    private Integer report_id;
    private Integer claim_id;
    private String file_path;
    private String uploaded_at;
    private boolean is_deleted;

    // Getters and Setters
    public int getImage_id() { return image_id; }
    public void setImage_id(int image_id) { this.image_id = image_id; }

    public Integer getReport_id() { return report_id; }
    public void setReport_id(Integer report_id) { this.report_id = report_id; }

    public Integer getClaim_id() { return claim_id; }
    public void setClaim_id(Integer claim_id) { this.claim_id = claim_id; }

    public String getFile_path() { return file_path; }
    public void setFile_path(String file_path) { this.file_path = file_path; }

    public String getUploaded_at() { return uploaded_at; }
    public void setUploaded_at(String uploaded_at) { this.uploaded_at = uploaded_at; }
    
    public boolean isIs_deleted() { return is_deleted; }
    public void setIs_deleted(boolean is_deleted) { this.is_deleted = is_deleted; }
}