package com.recorever.recorever_backend.dto;

import lombok.Data;

/**
 * Output DTO for returning Claim data.
 */
@Data
public class ClaimResponseDTO {
    private int claim_id;
    private int report_id;
    private int user_id;   
    private String user_name;
    private String item_name;
    private String status; // 'pending', 'approved', 'rejected'
    private String admin_remarks;
    private String claim_code;  
    private String created_at;
    private ReportResponseDTO report;
}