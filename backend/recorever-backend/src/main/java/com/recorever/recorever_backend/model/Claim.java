package com.recorever.recorever_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Claim {
    private int claim_id;
    private int report_id;
    private String claimant_name;
    private String contact_email;
    private String contact_phone;
    private String admin_remarks;
    private Object created_at; 
}