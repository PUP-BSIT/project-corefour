package com.recorever.recorever_backend.dto;

import lombok.Data;

/**
 * Output DTO for returning Claim data.
 */
@Data
public class ClaimResponseDTO {
    private int claim_id;
    private int report_id;
    private String proof_description;
    private String item_name;
    private String status; // 'pending', 'approved', 'rejected'
    private String created_at;
    private String claim_code; // Added field
}