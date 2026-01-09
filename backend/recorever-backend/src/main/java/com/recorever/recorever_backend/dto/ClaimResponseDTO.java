package com.recorever.recorever_backend.dto;

import lombok.Data;

@Data
public class ClaimResponseDTO {
    private int claim_id;
    private int report_id;
    private String claimant_name; 
    private String contact_email; 
    private String contact_phone; 
    private String admin_remarks;
    private String created_at;

    private int user_id;
    private String claim_code;
    private String status; 
    private String item_name;
    private ReportResponseDTO report;
}