package com.recorever.recorever_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// Fixed: Pure POJO, removed JPA Annotations and 'proofImages' to match JDBC/DB
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Claim {
    private int claim_id;
    private int report_id;
    private int user_id;
    private String claim_code;
    private String status;
    private String admin_remarks;
    private String created_at;
}